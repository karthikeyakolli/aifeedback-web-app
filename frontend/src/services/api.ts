// Typed API service connecting React Frontend to FastAPI Backend.

import type {
  Post,
  Comment,
  AIAnalysis,
  UserProfile,
  ReportPayload,
  AuthResponse,
  ChatSession,
  ChatMessage,
  ResearchAnswerResponse,
  ProductSuggestion,
  ResearchReport,
  ReportGeneratePayload,
  ReportUpdatePayload,
  AppNotification,
  ModerationReport,
  PostDocument,
  ProductReview,
  ReviewSourceAvailability,
  GenerateReviewRequest,
} from '../types';

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

  async listModerationReports(): Promise<ModerationReport[]> {
    const res = await fetch(`${API_BASE}/reports`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to load moderation reports' }));
      throw new Error(err.detail || 'Failed to load moderation reports');
    }
    return res.json();
  },

  async resolveModerationReport(reportId: string, action: 'hide' | 'dismiss' | 'warn' | 'restore', notes?: string): Promise<{ id: string; status: string }> {
    const res = await fetch(`${API_BASE}/reports/${reportId}/resolve`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ action, notes: notes || '' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to resolve report' }));
      throw new Error(err.detail || 'Failed to resolve report');
    }
    return res.json();
  },

  async togglePostLock(postId: string, locked: boolean): Promise<{ postId: string; isLocked: boolean; status: string }> {
    const res = await fetch(`${API_BASE}/reports/posts/${postId}/lock`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ locked }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update lock status' }));
      throw new Error(err.detail || 'Failed to update lock status');
    }
    return res.json();
  },

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------
  async getNotifications(unreadOnly = false): Promise<AppNotification[]> {
    const query = unreadOnly ? '?unread_only=true' : '';
    const res = await fetch(`${API_BASE}/notifications${query}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  async getUnreadNotificationCount(): Promise<number> {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: getHeaders(true),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.unreadCount || 0;
  },

  async markNotificationRead(notificationId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: getHeaders(true),
    });
    return res.ok;
  },

  async markAllNotificationsRead(): Promise<boolean> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    return res.ok;
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
  // AI Research Insights (Phase 3 Gemini-Powered Community Analysis)
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

  async triggerAiAnalysis(postId: string, forceRefresh: boolean = false): Promise<AIAnalysis> {
    const url = `${API_BASE}/ai/${postId}/analyze${forceRefresh ? '?force_refresh=true' : ''}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to synthesize feedback' }));
      throw new Error(err.detail || 'Analysis request failed');
    }
    return res.json();
  },

  // ---------------------------------------------------------------------------
  // Phase 4: Conversational Research Assistant & Suggestions Endpoints
  // ---------------------------------------------------------------------------
  async createChatSession(postId: string, title?: string): Promise<ChatSession> {
    const res = await fetch(`${API_BASE}/ai/${postId}/chat/sessions`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create chat session' }));
      throw new Error(err.detail || 'Failed to create research session');
    }
    return res.json();
  },

  async listChatSessions(postId: string): Promise<ChatSession[]> {
    const res = await fetch(`${API_BASE}/ai/${postId}/chat/sessions`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  async getChatSession(sessionId: string): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
    const res = await fetch(`${API_BASE}/ai/chat/sessions/${sessionId}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch session' }));
      throw new Error(err.detail || 'Session not found');
    }
    return res.json();
  },

  async deleteChatSession(sessionId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/ai/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      throw new Error('Failed to delete research session');
    }
  },

  async renameChatSession(sessionId: string, title: string): Promise<ChatSession> {
    const res = await fetch(`${API_BASE}/ai/chat/sessions/${sessionId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to rename session' }));
      throw new Error(err.detail || 'Failed to rename research session');
    }
    return res.json();
  },

  async sendChatMessage(
    sessionId: string,
    question: string,
    includedDocIds?: string[],
    includeCommunity?: boolean,
    sourceType?: 'community' | 'documents' | 'both',
    agentMode?: 'analytical' | 'professional' | 'visual' | 'explorer'
  ): Promise<ResearchAnswerResponse> {
    const res = await fetch(`${API_BASE}/ai/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        question,
        includedDocIds,
        includeCommunity: includeCommunity ?? true,
        sourceType: sourceType ?? 'both',
        agentMode: agentMode ?? 'analytical',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to send message' }));
      throw new Error(err.detail || 'Research assistant response failed');
    }
    return res.json();
  },

  async getProductSuggestions(postId: string): Promise<ProductSuggestion[]> {
    const res = await fetch(`${API_BASE}/ai/${postId}/suggestions`, {
      headers: getHeaders(false),
    });
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  // ---------------------------------------------------------------------------
  // Phase 5: Research Reports & PRD Documents
  // ---------------------------------------------------------------------------
  async generateResearchReport(postId: string, payload: ReportGeneratePayload): Promise<ResearchReport> {
    const res = await fetch(`${API_BASE}/ai/${postId}/reports/generate`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to generate document' }));
      throw new Error(err.detail || 'Failed to generate research report');
    }
    return res.json();
  },

  async listResearchReports(postId: string): Promise<ResearchReport[]> {
    const res = await fetch(`${API_BASE}/ai/${postId}/reports`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  async getResearchReport(reportId: string): Promise<ResearchReport> {
    const res = await fetch(`${API_BASE}/ai/reports/${reportId}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Report not found' }));
      throw new Error(err.detail || 'Research report not found');
    }
    return res.json();
  },

  async updateResearchReport(reportId: string, payload: ReportUpdatePayload): Promise<ResearchReport> {
    const res = await fetch(`${API_BASE}/ai/reports/${reportId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update report' }));
      throw new Error(err.detail || 'Failed to update research report draft');
    }
    return res.json();
  },

  async deleteResearchReport(reportId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/ai/reports/${reportId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      throw new Error('Failed to delete research report');
    }
  },

  async downloadResearchReport(reportId: string, format: 'md' | 'pdf'): Promise<Blob> {
    const res = await fetch(`${API_BASE}/ai/reports/${reportId}/download?format=${format}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      throw new Error(`Failed to download report as ${format.toUpperCase()}`);
    }
    return res.blob();
  },

  // ---------------------------------------------------------------------------
  // Phase 7: Project Documents & Owner Personal Workspace
  // ---------------------------------------------------------------------------
  async listPostDocuments(postId: string): Promise<PostDocument[]> {
    const res = await fetch(`${API_BASE}/posts/${postId}/documents`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  async uploadPostDocument(postId: string, file: File): Promise<PostDocument> {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/posts/${postId}/documents`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Failed to upload project document');
    }
    return res.json();
  },

  async getPostDocument(postId: string, docId: string): Promise<PostDocument> {
    const res = await fetch(`${API_BASE}/posts/${postId}/documents/${docId}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch document' }));
      throw new Error(err.detail || 'Failed to fetch project document');
    }
    return res.json();
  },

  async deletePostDocument(postId: string, docId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/posts/${postId}/documents/${docId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Delete failed' }));
      throw new Error(err.detail || 'Failed to delete project document');
    }
    return true;
  },

  // ===========================================================================
  // Phase 5: Developer Workspace & AI Testing Lab API Methods
  // ===========================================================================

  async getDevHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/dev/health`, {
      headers: getHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch dev health' }));
      throw new Error(err.detail || 'Developer Workspace is disabled in production.');
    }
    return res.json();
  },

  async runAITest(req: {
    category: string;
    post_id?: string;
    query?: string;
    source_filter?: string;
    selected_doc_ids?: string[];
    provider?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/dev/ai-test`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Test execution failed' }));
      throw new Error(err.detail || 'Failed to execute AI test case');
    }
    return res.json();
  },

  async getEvaluationBenchmark(): Promise<any> {
    const res = await fetch(`${API_BASE}/dev/evaluation/benchmark`, {
      headers: getHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Benchmark execution failed' }));
      throw new Error(err.detail || 'Failed to execute evaluation benchmark suite');
    }
    return res.json();
  },

  async manageSyntheticData(action: 'seed' | 'reset' | 'delete' | 'preview' | 'export'): Promise<any> {
    const res = await fetch(`${API_BASE}/dev/synthetic-data/${action}`, {
      method: 'POST',
      headers: getHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Synthetic action failed' }));
      throw new Error(err.detail || `Failed to execute synthetic data action: ${action}`);
    }
    return res.json();
  },

  async getDevQuickToken(accountType: 'creator' | 'visitor' | 'moderator'): Promise<any> {
    const res = await fetch(`${API_BASE}/dev/quick-token`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ account_type: accountType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Quick token failed' }));
      throw new Error(err.detail || 'Failed to generate developer auth token');
    }
    return res.json();
  },

  // ===========================================================================
  // Full Product Review & Review-Linked Research Conversation
  // ===========================================================================

  async getReviewSources(postId: string): Promise<ReviewSourceAvailability> {
    const res = await fetch(`${API_BASE}/ai/${postId}/review/sources`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch source availability' }));
      throw new Error(err.detail || 'Failed to fetch source availability');
    }
    return res.json();
  },

  async generateProductReview(postId: string, data: GenerateReviewRequest): Promise<ProductReview> {
    const res = await fetch(`${API_BASE}/ai/${postId}/review/generate`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to generate product review' }));
      throw new Error(err.detail || 'Failed to generate product review');
    }
    return res.json();
  },

  async listProductReviews(postId: string): Promise<ProductReview[]> {
    const res = await fetch(`${API_BASE}/ai/${postId}/reviews`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to list product reviews' }));
      throw new Error(err.detail || 'Failed to list product reviews');
    }
    return res.json();
  },

  async getProductReview(reviewId: string): Promise<ProductReview> {
    const res = await fetch(`${API_BASE}/ai/reviews/${reviewId}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to get product review' }));
      throw new Error(err.detail || 'Failed to get product review');
    }
    return res.json();
  },

  async downloadProductReview(reviewId: string, format: 'md' | 'pdf'): Promise<Blob> {
    const res = await fetch(`${API_BASE}/ai/reviews/${reviewId}/download?format=${format}`, {
      headers: {
        Authorization: `Bearer ${getStoredToken() || ''}`,
      },
    });
    if (!res.ok) {
      throw new Error('Failed to download review export');
    }
    return res.blob();
  },

  async getReviewConversation(reviewId: string): Promise<{
    reviewId: string;
    reviewVersion: number;
    session: ChatSession;
    messages: ChatMessage[];
  }> {
    const res = await fetch(`${API_BASE}/ai/reviews/${reviewId}/conversation`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to get review conversation' }));
      throw new Error(err.detail || 'Failed to get review conversation');
    }
    return res.json();
  },

  async sendReviewMessage(
    reviewId: string,
    data: { question: string; agentMode?: string }
  ): Promise<ChatMessage> {
    const res = await fetch(`${API_BASE}/ai/reviews/${reviewId}/messages`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to send message' }));
      throw new Error(err.detail || 'Failed to send message');
    }
    return res.json();
  },
};


