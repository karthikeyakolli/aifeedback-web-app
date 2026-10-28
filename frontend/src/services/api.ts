// Typed API service connecting React Frontend to FastAPI Backend.

import type { Post, Comment, AIAnalysis, UserProfile, ReportPayload, AuthResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const TOKEN_STORAGE_KEY = 'pri_auth_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const getHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (includeAuth) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

export const api = {
  // ---------------------------------------------------------------------------
  // Authentication & Session
  // ---------------------------------------------------------------------------
  async signup(data: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    bio?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        username: data.username,
        display_name: data.displayName,
        bio: data.bio || '',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    const authData: AuthResponse = await res.json();
    setStoredToken(authData.accessToken);
    return authData;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Invalid email or password');
    }
    const authData: AuthResponse = await res.json();
    setStoredToken(authData.accessToken);
    return authData;
  },

  async getCurrentUser(): Promise<UserProfile> {
    const token = getStoredToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      clearStoredToken();
      throw new Error('Session expired or invalid');
    }
    return res.json();
  },

  async logout(): Promise<void> {
    const token = getStoredToken();
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: getHeaders(true),
        });
      } catch {
        // Clear token regardless of server response
      }
    }
    clearStoredToken();
  },

  // ---------------------------------------------------------------------------
  // Posts CRUD, Voting, Bookmarks
  // ---------------------------------------------------------------------------
  async getPosts(
    categoryOrParams?: string | {
      category?: string;
      sort?: string;
      search?: string;
      tag?: string;
      limit?: number;
      offset?: number;
    },
    sortParam: string = 'trending'
  ): Promise<Post[]> {
    const q = new URLSearchParams();
    if (typeof categoryOrParams === 'string') {
      if (categoryOrParams && categoryOrParams !== 'All') {
        q.append('category', categoryOrParams);
      }
      if (sortParam) q.append('sort', sortParam);
    } else if (categoryOrParams) {
      if (categoryOrParams.category && categoryOrParams.category !== 'All') {
        q.append('category', categoryOrParams.category);
      }
      if (categoryOrParams.sort) q.append('sort', categoryOrParams.sort);
      if (categoryOrParams.search && categoryOrParams.search.trim()) {
        q.append('search', categoryOrParams.search.trim());
      }
      if (categoryOrParams.tag && categoryOrParams.tag.trim()) {
        q.append('tag', categoryOrParams.tag.trim());
      }
      if (categoryOrParams.limit) q.append('limit', categoryOrParams.limit.toString());
      if (categoryOrParams.offset) q.append('offset', categoryOrParams.offset.toString());
    }

    const res = await fetch(`${API_BASE}/posts?${q.toString()}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  },

  async getPostById(postId: string): Promise<Post | null> {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      headers: getHeaders(true),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch post');
    return res.json();
  },

  async createPost(data: {
    title: string;
    description: string;
    category: Post['category'];
    postType: Post['postType'];
    productUrl?: string;
    tags: string[];
    isAnonymous: boolean;
  }): Promise<Post> {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create post' }));
      throw new Error(err.detail || 'Failed to create post');
    }
    return res.json();
  },

  async updatePost(
    postId: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      productUrl?: string;
      tags?: string[];
    }
  ): Promise<Post> {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update post' }));
      throw new Error(err.detail || 'Failed to update post');
    }
    return res.json();
  },

  async deletePost(postId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to delete post' }));
      throw new Error(err.detail || 'Failed to delete post');
    }
  },

  async toggleUpvotePost(postId: string): Promise<{ upvotesCount: number; userHasUpvoted: boolean }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/vote`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upvote post' }));
      throw new Error(err.detail || 'Authentication required to vote');
    }
    return res.json();
  },

  async toggleBookmarkPost(postId: string): Promise<{ userHasBookmarked: boolean }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/bookmark`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to bookmark post' }));
      throw new Error(err.detail || 'Authentication required to bookmark');
    }
    return res.json();
  },

  async getSavedPosts(): Promise<Post[]> {
    const res = await fetch(`${API_BASE}/posts/saved`, {
      headers: getHeaders(true),
    });
    if (!res.ok) throw new Error('Failed to fetch saved posts');
    return res.json();
  },

  // ---------------------------------------------------------------------------
  // Comments CRUD, Threaded Replies, Voting
  // ---------------------------------------------------------------------------
  async getComments(postId: string): Promise<Comment[]> {
    const res = await fetch(`${API_BASE}/comments/post/${postId}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async addComment(data: {
    postId: string;
    content: string;
    isAnonymous: boolean;
    parentCommentId?: string;
  }): Promise<Comment> {
    const res = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to add comment' }));
      throw new Error(err.detail || 'Failed to add comment');
    }
    return res.json();
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const res = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update comment' }));
      throw new Error(err.detail || 'Failed to update comment');
    }
    return res.json();
  },

  async deleteComment(commentId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to delete comment' }));
      throw new Error(err.detail || 'Failed to delete comment');
    }
  },

  async toggleUpvoteComment(
    commentId: string
  ): Promise<{ upvotesCount: number; userHasUpvoted: boolean }> {
    const res = await fetch(`${API_BASE}/comments/${commentId}/vote`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to vote on comment' }));
      throw new Error(err.detail || 'Authentication required to vote');
    }
    return res.json();
  },

  // ---------------------------------------------------------------------------
  // Reports & Moderation
  // ---------------------------------------------------------------------------
  async submitReport(payload: ReportPayload): Promise<{ id: string; message: string }> {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to submit report' }));
      throw new Error(err.detail || 'Failed to submit report');
    }
    return res.json();
  },

  // ---------------------------------------------------------------------------
  // User Public Profiles
  // ---------------------------------------------------------------------------
  async getUserPublicProfile(userId: string): Promise<UserProfile & { posts: Post[] }> {
    const res = await fetch(`${API_BASE}/users/${userId}/profile`, {
      headers: getHeaders(false),
    });
    if (!res.ok) throw new Error('User profile not found');
    return res.json();
  },

  // ---------------------------------------------------------------------------
  // AI Research Insights (Phase 2 Stub / Unavailable State)
  // ---------------------------------------------------------------------------
  async getAiAnalysis(postId: string): Promise<AIAnalysis | null> {
    try {
      const res = await fetch(`${API_BASE}/ai/${postId}/insights`, {
        headers: getHeaders(true),
      });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async triggerAiAnalysis(_postId: string): Promise<AIAnalysis> {
    throw new Error('The AI Research Synthesis Engine is scheduled for Phase 3. Real community persistence is currently live.');
  },
};
