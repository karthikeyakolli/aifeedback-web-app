import type { Post, Comment, AIAnalysis, UserProfile } from '../types';
import { mockPosts, mockComments, mockAiAnalysis, mockCurrentUser } from '../fixtures/mockData';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_FALLBACK !== 'false';

// In-memory working copies for interactive mock experience
let inMemoryPosts: Post[] = [...mockPosts];
let inMemoryComments: Record<string, Comment[]> = { ...mockComments };
let inMemorySavedIds: Set<string> = new Set(['post_reflect_01']);

// Simulated delay helper
const delay = (ms: number = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  // Posts
  async getPosts(category?: string, sort: string = 'trending'): Promise<Post[]> {
    if (USE_MOCK) {
      await delay();
      let results = [...inMemoryPosts];
      if (category && category !== 'All') {
        results = results.filter((p) => p.category === category);
      }
      if (sort === 'trending') {
        results.sort((a, b) => b.upvotesCount - a.upvotesCount);
      } else if (sort === 'recent') {
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sort === 'comments') {
        results.sort((a, b) => b.commentsCount - a.commentsCount);
      }
      return results;
    }

    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    params.append('sort', sort);
    const res = await fetch(`${API_BASE}/posts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  },

  async getPostById(postId: string): Promise<Post | null> {
    if (USE_MOCK) {
      await delay();
      const post = inMemoryPosts.find((p) => p.id === postId);
      return post || null;
    }

    const res = await fetch(`${API_BASE}/posts/${postId}`);
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
    if (USE_MOCK) {
      await delay(400);
      const newPost: Post = {
        id: `post_${Date.now()}`,
        title: data.title,
        description: data.description,
        category: data.category,
        postType: data.postType,
        productUrl: data.productUrl,
        tags: data.tags,
        author: data.isAnonymous
          ? { username: 'anonymous', displayName: 'Anonymous Contributor', isAnonymous: true }
          : { ...mockCurrentUser, isAnonymous: false },
        isAnonymous: data.isAnonymous,
        upvotesCount: 1,
        commentsCount: 0,
        hasAiAnalysis: false,
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userHasUpvoted: true,
        userHasBookmarked: false,
      };
      inMemoryPosts = [newPost, ...inMemoryPosts];
      return newPost;
    }

    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create post');
    return res.json();
  },

  async toggleUpvotePost(postId: string): Promise<{ upvotesCount: number; userHasUpvoted: boolean }> {
    if (USE_MOCK) {
      await delay(150);
      const post = inMemoryPosts.find((p) => p.id === postId);
      if (!post) throw new Error('Post not found');
      post.userHasUpvoted = !post.userHasUpvoted;
      post.upvotesCount += post.userHasUpvoted ? 1 : -1;
      return { upvotesCount: post.upvotesCount, userHasUpvoted: post.userHasUpvoted };
    }

    const res = await fetch(`${API_BASE}/posts/${postId}/vote`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle upvote');
    return res.json();
  },

  async toggleBookmarkPost(postId: string): Promise<{ userHasBookmarked: boolean }> {
    if (USE_MOCK) {
      await delay(150);
      const post = inMemoryPosts.find((p) => p.id === postId);
      if (!post) throw new Error('Post not found');
      if (inMemorySavedIds.has(postId)) {
        inMemorySavedIds.delete(postId);
        post.userHasBookmarked = false;
      } else {
        inMemorySavedIds.add(postId);
        post.userHasBookmarked = true;
      }
      return { userHasBookmarked: post.userHasBookmarked };
    }

    const res = await fetch(`${API_BASE}/posts/${postId}/bookmark`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle bookmark');
    return res.json();
  },

  async getSavedPosts(): Promise<Post[]> {
    if (USE_MOCK) {
      await delay();
      return inMemoryPosts.filter((p) => inMemorySavedIds.has(p.id));
    }
    const res = await fetch(`${API_BASE}/posts/saved`);
    if (!res.ok) throw new Error('Failed to fetch saved posts');
    return res.json();
  },

  // Comments
  async getComments(postId: string): Promise<Comment[]> {
    if (USE_MOCK) {
      await delay();
      return inMemoryComments[postId] || [];
    }
    const res = await fetch(`${API_BASE}/comments/post/${postId}`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async addComment(data: {
    postId: string;
    content: string;
    isAnonymous: boolean;
    parentCommentId?: string;
  }): Promise<Comment> {
    if (USE_MOCK) {
      await delay(300);
      const newComment: Comment = {
        id: `cmt_${Date.now()}`,
        postId: data.postId,
        parentCommentId: data.parentCommentId,
        author: data.isAnonymous
          ? { username: 'anonymous', displayName: 'Anonymous Reviewer', isAnonymous: true }
          : { ...mockCurrentUser, isAnonymous: false },
        content: data.content,
        isAnonymous: data.isAnonymous,
        upvotesCount: 0,
        isHelpfulFlag: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userHasUpvoted: false,
        replies: [],
      };

      if (!inMemoryComments[data.postId]) {
        inMemoryComments[data.postId] = [];
      }

      if (data.parentCommentId) {
        const findAndAdd = (list: Comment[]): boolean => {
          for (const c of list) {
            if (c.id === data.parentCommentId) {
              c.replies = c.replies ? [...c.replies, newComment] : [newComment];
              return true;
            }
            if (c.replies && findAndAdd(c.replies)) return true;
          }
          return false;
        };
        findAndAdd(inMemoryComments[data.postId]);
      } else {
        inMemoryComments[data.postId].push(newComment);
      }

      // Increment comment count on post
      const post = inMemoryPosts.find((p) => p.id === data.postId);
      if (post) post.commentsCount += 1;

      return newComment;
    }

    const res = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  },

  async toggleUpvoteComment(
    commentId: string
  ): Promise<{ upvotesCount: number; userHasUpvoted: boolean }> {
    if (USE_MOCK) {
      await delay(150);
      let target: Comment | undefined;
      for (const list of Object.values(inMemoryComments)) {
        const findInTree = (items: Comment[]): Comment | undefined => {
          for (const item of items) {
            if (item.id === commentId) return item;
            if (item.replies) {
              const res = findInTree(item.replies);
              if (res) return res;
            }
          }
          return undefined;
        };
        target = findInTree(list);
        if (target) break;
      }

      if (!target) throw new Error('Comment not found');
      target.userHasUpvoted = !target.userHasUpvoted;
      target.upvotesCount += target.userHasUpvoted ? 1 : -1;
      return { upvotesCount: target.upvotesCount, userHasUpvoted: target.userHasUpvoted };
    }

    const res = await fetch(`${API_BASE}/comments/${commentId}/vote`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle comment vote');
    return res.json();
  },

  // AI Intelligence
  async getAiAnalysis(postId: string): Promise<AIAnalysis | null> {
    if (USE_MOCK) {
      await delay(350);
      return mockAiAnalysis[postId] || null;
    }

    const res = await fetch(`${API_BASE}/ai/${postId}/insights`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch AI insights');
    return res.json();
  },

  async triggerAiAnalysis(postId: string): Promise<AIAnalysis> {
    if (USE_MOCK) {
      await delay(1200); // Simulate analytical synthesis
      const existing = mockAiAnalysis[postId];
      if (existing) {
        return {
          ...existing,
          createdAt: new Date().toISOString(),
          isCached: false,
        };
      }
      throw new Error('Analysis synthesis for new posts will be enabled in Phase 3.');
    }

    const res = await fetch(`${API_BASE}/ai/${postId}/analyze`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger AI analysis');
    return res.json();
  },

  // User Profile
  async getCurrentUser(): Promise<UserProfile> {
    if (USE_MOCK) {
      await delay();
      return mockCurrentUser;
    }
    const res = await fetch(`${API_BASE}/users/me`);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },
};
