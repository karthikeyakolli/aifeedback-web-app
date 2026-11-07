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
  Project,
  ProjectCreatePayload,
  ProjectUpdatePayload,
  FeedbackFinding,
  FeedbackReport,
  AIReviewStatus,
  AIReviewStartPayload,
  FeedbackReportComparison,
  ReportExportResponse,
  PublicProject,
  PublicUpvoteResponse,
  PublicCommentRecent,
  ProjectApkRelease,
  CreatorProfile,
  CreatorProfileUpdatePayload,
  CreatorStudioOverview,
  PublicCreatorProfile,
  CredentialMetadata,
  CredentialTestResult,
  AuthenticatedPrincipal,
  UserIdentity,
  MFAStatus,
  MFAEnrollmentData,
  ProjectSource,
  RetrievedKnowledgeEvidence,
  ProjectAIConfig,
  ProjectAIUsageSummary,
  CompletenessMapData,
  ProjectChat,
  ProjectChatMessage,
  ImprovementTask,
  GuidedDiscoveryQuestion,
  FindingEvidenceCitation,
  AIBudget,
  BudgetUpdatePayload,
  ProjectChangelogEntry,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const TOKEN_STORAGE_KEY = 'pri_auth_token';
const LOCAL_PROJECTS_KEY = 'pri_local_projects';

const getStoredProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

const saveStoredProjects = (projs: Project[]): void => {
  try {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projs));
  } catch {}
};

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

    try {
      const res = await fetch(`${API_BASE}/posts?${q.toString()}`, {
        headers: getHeaders(true),
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async getPostById(postId: string): Promise<Post | null> {
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}`, {
        headers: getHeaders(true),
      });
      if (res.status === 404) return null;
      if (res.ok) return await res.json();
    } catch {}
    return null;
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
  async getRecentComments(
    optionsOrLimit: number | { limit?: number; projectId?: string; sort?: 'popular' | 'recent' } = 25
  ): Promise<PublicCommentRecent[]> {
    try {
      const limit = typeof optionsOrLimit === 'number' ? optionsOrLimit : (optionsOrLimit.limit || 25);
      const projectId = typeof optionsOrLimit === 'object' ? optionsOrLimit.projectId : undefined;
      const sort = typeof optionsOrLimit === 'object' ? optionsOrLimit.sort : 'popular';

      const query = new URLSearchParams();
      query.set('limit', String(limit));
      if (projectId) query.set('project_id', projectId);
      if (sort) query.set('sort', sort);

      const res = await fetch(`${API_BASE}/comments/recent?${query.toString()}`, {
        headers: getHeaders(true),
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async getComments(postId: string): Promise<Comment[]> {
    try {
      const res = await fetch(`${API_BASE}/comments/post/${postId}`, {
        headers: getHeaders(true),
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
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

  // ---------------------------------------------------------------------------
  // Project Management & Intake (Phase 2 & 4)
  // ---------------------------------------------------------------------------
  async createProject(payload: ProjectCreatePayload): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({ detail: 'Failed to create project' }));
    throw new Error(err.detail || 'Failed to create project');
  },

  async getProjects(params?: {
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Project[]> {
    return this.getPersonalProjects(params);
  },

  async getPersonalProjects(params?: {
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Project[]> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      if (params?.category && params.category !== 'all') query.set('category', params.category);
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.offset) query.set('offset', String(params.offset));

      const res = await fetch(`${API_BASE}/projects/personal?${query.toString()}`, {
        headers: getHeaders(true),
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async getPublicProjects(params?: {
    category?: string;
    search?: string;
    sort?: 'trending' | 'new' | 'most_discussed' | string;
    limit?: number;
    offset?: number;
  }): Promise<PublicProject[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category && params.category !== 'all') query.set('category', params.category);
      if (params?.search) query.set('search', params.search);
      if (params?.sort) query.set('sort', params.sort);
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.offset) query.set('offset', String(params.offset));

      const res = await fetch(`${API_BASE}/projects/public?${query.toString()}`, {
        headers: getHeaders(false),
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  // ---------------------------------------------------------------------------
  // Android APK Releases & Quarantine Management
  // ---------------------------------------------------------------------------
  async uploadProjectApk(projectId: string, formData: FormData): Promise<ProjectApkRelease> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/releases/apk`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getStoredToken() || ''}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upload APK release' }));
      throw new Error(err.detail || 'Failed to upload APK release');
    }
    return res.json();
  },

  async getProjectApkReleases(projectId: string): Promise<ProjectApkRelease[]> {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/releases/apk`, {
        headers: getHeaders(true),
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async updateProjectApkReleaseStatus(projectId: string, releaseId: string, status: string): Promise<ProjectApkRelease> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/releases/apk/${releaseId}/status`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update release status' }));
      throw new Error(err.detail || 'Failed to update release status');
    }
    return res.json();
  },

  getApkDownloadUrl(projectId: string, releaseId: string): string {
    return `${API_BASE}/projects/${projectId}/releases/apk/${releaseId}/download`;
  },

  async getPublicProject(projectId: string): Promise<PublicProject> {
    const res = await fetch(`${API_BASE}/projects/public/${projectId}`, {
      headers: getHeaders(false),
    });
    if (res.ok) return await res.json();
    throw new Error('Public project not found');
  },

  async getPublicFeedbackReport(projectId: string): Promise<FeedbackReport | null> {
    try {
      const res = await fetch(`${API_BASE}/projects/public/${projectId}/report`, {
        headers: getHeaders(false),
      });
      if (res.ok) return await res.json();
    } catch {}
    return this.getProjectFeedbackReport(projectId);
  },

  async upvotePublicProject(projectId: string): Promise<PublicUpvoteResponse> {
    try {
      const res = await fetch(`${API_BASE}/projects/public/${projectId}/upvote`, {
        method: 'POST',
        headers: getHeaders(true),
      });
      if (res.ok) return await res.json();
    } catch {}
    return {
      projectId,
      upvotesCount: 25,
      hasUpvoted: true,
    };
  },

  async getProject(projectId: string): Promise<Project> {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        headers: getHeaders(true),
      });
      if (res.ok) return await res.json();
    } catch {}
    const p = getStoredProjects().find(proj => proj.id === projectId);
    if (p) return p;
    throw new Error('Project not found');
  },

  async updateProject(projectId: string, updates: ProjectUpdatePayload): Promise<Project> {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify(updates),
      });
      if (res.ok) return await res.json();
    } catch {}
    const projs = getStoredProjects();
    const idx = projs.findIndex(p => p.id === projectId);
    if (idx >= 0) {
      projs[idx] = {
        ...projs[idx],
        ...updates,
        isPublic: updates.isPublic !== undefined ? updates.isPublic : projs[idx].isPublic,
        updatedAt: new Date().toISOString(),
      };
      saveStoredProjects(projs);
      return projs[idx];
    }
    throw new Error('Project not found');
  },

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'DELETE',
        headers: getHeaders(true),
      });
      if (res.ok) return true;
    } catch {}
    const projs = getStoredProjects().filter(p => p.id !== projectId);
    saveStoredProjects(projs);
    return true;
  },

  async updateFindingStatus(
    findingId: string,
    status: 'open' | 'in_progress' | 'addressed'
  ): Promise<FeedbackFinding> {
    const res = await fetch(`${API_BASE}/findings/${findingId}/status`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });
    if (res.ok) return await res.json();
    throw new Error('Failed to update finding status');
  },

  async startAIReview(
    projectId: string,
    payload?: AIReviewStartPayload
  ): Promise<AIReviewStatus> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/review/start`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload || {}),
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({ detail: 'Failed to initiate AI review' }));
    throw new Error(err.detail || 'Failed to initiate AI review');
  },

  async getAIReviewStatus(
    projectId: string,
    reviewId: string
  ): Promise<AIReviewStatus> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/reviews/${reviewId}/status`, {
      headers: getHeaders(true),
    });
    if (res.ok) return await res.json();
    throw new Error('Failed to fetch AI review status');
  },

  async getProjectFeedbackReport(
    projectId: string
  ): Promise<FeedbackReport | null> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/report`, {
      headers: getHeaders(true),
    });
    if (res.ok) return await res.json();
    return null;
  },

  async getProjectReviews(
    projectId: string
  ): Promise<AIReviewStatus[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/reviews`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch project reviews' }));
      throw new Error(err.detail || 'Failed to fetch project reviews');
    }
    return res.json();
  },

  async getProjectReports(
    projectId: string
  ): Promise<FeedbackReport[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/reports`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch project reports' }));
      throw new Error(err.detail || 'Failed to fetch project reports');
    }
    return res.json();
  },

  async getProjectReportById(
    projectId: string,
    reportId: string
  ): Promise<FeedbackReport> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/reports/${reportId}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch feedback report' }));
      throw new Error(err.detail || 'Failed to fetch feedback report');
    }
    return res.json();
  },

  async getReportByReviewId(
    projectId: string,
    reviewId: string
  ): Promise<FeedbackReport | null> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/reviews/${reviewId}/report`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch report for review' }));
      throw new Error(err.detail || 'Failed to fetch report for review');
    }
    return res.json();
  },

  async exportFeedbackReport(
    projectId: string,
    reportId?: string
  ): Promise<ReportExportResponse> {
    const query = reportId ? `?report_id=${encodeURIComponent(reportId)}` : '';
    const res = await fetch(`${API_BASE}/projects/${projectId}/report/export${query}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to export feedback report' }));
      throw new Error(err.detail || 'Failed to export feedback report');
    }
    return res.json();
  },

  async compareFeedbackReports(
    projectId: string,
    baseId: string,
    targetId: string
  ): Promise<FeedbackReportComparison> {
    const res = await fetch(
      `${API_BASE}/projects/${projectId}/reports/compare?base_id=${encodeURIComponent(baseId)}&target_id=${encodeURIComponent(targetId)}`,
      {
        headers: getHeaders(true),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to compare feedback reports' }));
      throw new Error(err.detail || 'Failed to compare feedback reports');
    }
    return res.json();
  },

  // ---------------------------------------------------------------------------
  // Creator Space (Phase 9)
  // ---------------------------------------------------------------------------
  async getCreatorStudio(): Promise<CreatorStudioOverview> {
    const res = await fetch(`${API_BASE}/creator/studio`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch creator studio' }));
      throw new Error(err.detail || 'Failed to fetch creator studio');
    }
    return res.json();
  },

  async updateCreatorProfile(
    payload: CreatorProfileUpdatePayload
  ): Promise<CreatorProfile> {
    const res = await fetch(`${API_BASE}/creator/profile`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update creator profile' }));
      throw new Error(err.detail || 'Failed to update creator profile');
    }
    return res.json();
  },

  async publishCreatorProject(projectId: string): Promise<{ id: string; isPublic: boolean }> {
    const res = await fetch(`${API_BASE}/creator/projects/${projectId}/publish`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to publish project' }));
      throw new Error(err.detail || 'Failed to publish project');
    }
    return res.json();
  },

  async unpublishCreatorProject(projectId: string): Promise<{ id: string; isPublic: boolean }> {
    const res = await fetch(`${API_BASE}/creator/projects/${projectId}/unpublish`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to unpublish project' }));
      throw new Error(err.detail || 'Failed to unpublish project');
    }
    return res.json();
  },

  async getPublicCreatorProfile(usernameOrId: string): Promise<PublicCreatorProfile> {
    const res = await fetch(`${API_BASE}/creators/${encodeURIComponent(usernameOrId)}`, {
      headers: getHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Creator profile not found' }));
      throw new Error(err.detail || 'Creator profile not found');
    }
    return res.json();
  },

  // ---------------------------------------------------------------------------
  // Phase 3 — BYOK Credential Vault (Server-Side AES-256-GCM)
  // ---------------------------------------------------------------------------
  async listCredentials(): Promise<CredentialMetadata[]> {
    const res = await fetch(`${API_BASE}/credentials`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to list credentials' }));
      throw new Error(err.detail || 'Failed to list credentials');
    }
    return res.json();
  },

  async addCredential(data: {
    provider: string;
    displayName: string;
    secret: string;
  }): Promise<CredentialMetadata> {
    const res = await fetch(`${API_BASE}/credentials`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to save credential' }));
      throw new Error(err.detail || 'Failed to save credential');
    }
    return res.json();
  },

  async getCredential(credentialId: string): Promise<CredentialMetadata> {
    const res = await fetch(`${API_BASE}/credentials/${credentialId}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Credential not found' }));
      throw new Error(err.detail || 'Credential not found');
    }
    return res.json();
  },

  async testCredential(credentialId: string): Promise<CredentialTestResult> {
    const res = await fetch(`${API_BASE}/credentials/${credentialId}/test`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Credential test failed' }));
      throw new Error(err.detail || 'Credential test failed');
    }
    return res.json();
  },

  async updateCredential(
    credentialId: string,
    data: { displayName?: string; isEnabled?: boolean }
  ): Promise<CredentialMetadata> {
    const res = await fetch(`${API_BASE}/credentials/${credentialId}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update credential' }));
      throw new Error(err.detail || 'Failed to update credential');
    }
    return res.json();
  },

  async rotateCredential(credentialId: string, newSecret: string): Promise<CredentialMetadata> {
    const res = await fetch(`${API_BASE}/credentials/${credentialId}/rotate`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ newSecret }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to rotate secret' }));
      throw new Error(err.detail || 'Failed to rotate secret');
    }
    return res.json();
  },

  async deleteCredential(credentialId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/credentials/${credentialId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to delete credential' }));
      throw new Error(err.detail || 'Failed to delete credential');
    }
    return res.json();
  },

  async migrateLocalStorageCredentials(): Promise<{ migratedCount: number; errors: string[] }> {
    const providerKeys = [
      { key: 'gemini_api_key', provider: 'gemini', name: 'Migrated Gemini Key' },
      { key: 'openrouter_api_key', provider: 'openrouter', name: 'Migrated OpenRouter Key' },
      { key: 'nvidia_api_key', provider: 'nvidia', name: 'Migrated NVIDIA Key' },
      { key: 'groq_api_key', provider: 'groq', name: 'Migrated Groq Key' },
    ];
    let count = 0;
    const errors: string[] = [];

    for (const item of providerKeys) {
      const secret = localStorage.getItem(item.key);
      if (secret && secret.trim().length > 0) {
        try {
          await this.addCredential({
            provider: item.provider,
            displayName: item.name,
            secret: secret.trim(),
          });
          localStorage.removeItem(item.key);
          count++;
        } catch (e: any) {
          errors.push(`Failed to migrate ${item.provider}: ${e?.message || e}`);
        }
      }
    }
    return { migratedCount: count, errors };
  },

  // ---------------------------------------------------------------------------
  // Phase 3 — Unified Identity, MFA, and Password Reset
  // ---------------------------------------------------------------------------
  async getAuthConfig(): Promise<{ provider: string; isSupabase: boolean; mfaEnabled: boolean; oauthProviders: string[] }> {
    const res = await fetch(`${API_BASE}/auth/config`);
    return res.json();
  },

  async getPrincipal(): Promise<AuthenticatedPrincipal> {
    const res = await fetch(`${API_BASE}/auth/principal`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      throw new Error('Failed to retrieve authenticated principal');
    }
    return res.json();
  },

  async requestPasswordReset(email: string): Promise<{ message: string; devToken?: string }> {
    const res = await fetch(`${API_BASE}/auth/password-reset/request`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/password-reset/confirm`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to reset password' }));
      throw new Error(err.detail || 'Failed to reset password');
    }
    return res.json();
  },

  async oauthCallback(provider: string, code: string, state: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/oauth/callback`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ provider, code, state }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'OAuth authentication failed' }));
      throw new Error(err.detail || 'OAuth authentication failed');
    }
    const data: AuthResponse = await res.json();
    setStoredToken(data.accessToken);
    return data;
  },

  async listLinkedIdentities(): Promise<UserIdentity[]> {
    const res = await fetch(`${API_BASE}/auth/identities`, {
      headers: getHeaders(true),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async unlinkIdentity(provider: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/identities/${provider}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to unlink identity' }));
      throw new Error(err.detail || 'Failed to unlink identity');
    }
    return res.json();
  },

  async getMFAStatus(): Promise<MFAStatus> {
    const res = await fetch(`${API_BASE}/auth/mfa/status`, {
      headers: getHeaders(true),
    });
    if (!res.ok) return { is_enabled: false, factor_type: null };
    return res.json();
  },

  async enrollMFA(): Promise<MFAEnrollmentData> {
    const res = await fetch(`${API_BASE}/auth/mfa/enroll`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to start MFA enrollment' }));
      throw new Error(err.detail || 'Failed to start MFA enrollment');
    }
    return res.json();
  },

  async verifyMFA(code: string): Promise<MFAStatus> {
    const res = await fetch(`${API_BASE}/auth/mfa/verify`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid MFA verification code' }));
      throw new Error(err.detail || 'Invalid MFA verification code');
    }
    return res.json();
  },

  async unenrollMFA(): Promise<MFAStatus> {
    const res = await fetch(`${API_BASE}/auth/mfa/unenroll`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to disable MFA' }));
      throw new Error(err.detail || 'Failed to disable MFA');
    }
    return res.json();
  },

  // Project Sources (Phase 4)
  async uploadProjectSource(projectId: string, file: File): Promise<ProjectSource[]> {
    const formData = new FormData();
    formData.append('file', file);
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/projects/${projectId}/sources/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upload source file' }));
      throw new Error(err.detail || 'Failed to upload source file');
    }
    return res.json();
  },

  async linkProjectRepository(projectId: string, repositoryUrl: string): Promise<ProjectSource[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/sources/repository`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ repository_url: repositoryUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to link repository' }));
      throw new Error(err.detail || 'Failed to link repository');
    }
    return res.json();
  },

  async listProjectSources(projectId: string): Promise<ProjectSource[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/sources`, {
      headers: getHeaders(true),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async deleteProjectSource(projectId: string, sourceId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/sources/${sourceId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return res.ok;
  },

  // Project RAG (Phase 5)
  async queryProjectRAG(projectId: string, query: string, topK = 6): Promise<RetrievedKnowledgeEvidence[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/rag/query`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ query, top_k: topK, include_reference: true }),
    });
    if (!res.ok) return [];
    return res.json();
  },

  // AI Orchestration & Usage Ledger (Phase 6)
  async getProjectAIConfig(projectId: string): Promise<Record<string, ProjectAIConfig>> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/ai-config`, {
      headers: getHeaders(true),
    });
    if (!res.ok) return {};
    return res.json();
  },

  async setProjectAIConfig(
    projectId: string,
    config: { taskType?: string; primaryProvider: string; fallbackProvider?: string; modelOverride?: string }
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/ai-config`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        task_type: config.taskType || 'review',
        primary_provider: config.primaryProvider,
        fallback_provider: config.fallbackProvider || 'openrouter',
        model_override: config.modelOverride,
      }),
    });
    if (!res.ok) throw new Error('Failed to update project AI configuration');
    return res.json();
  },

  async getProjectAIUsage(projectId: string): Promise<ProjectAIUsageSummary> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/usage`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      return { projectId, totalCalls: 0, totalTokens: 0, totalCostUsd: 0, averageLatencyMs: 0 };
    }
    return res.json();
  },

  // Comprehensive AI Intelligence (Phase 7)
  async runComprehensiveAudit(projectId: string, reviewMode = 'comprehensive', roles?: string[]): Promise<any> {
    const q = new URLSearchParams({ review_mode: reviewMode });
    if (roles && roles.length) {
      roles.forEach(r => q.append('roles', r));
    }
    const res = await fetch(`${API_BASE}/projects/${projectId}/audit?${q.toString()}`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to run comprehensive audit' }));
      throw new Error(err.detail || 'Failed to run comprehensive audit');
    }
    return res.json();
  },

  async getDiscoveryQuestions(projectId: string): Promise<GuidedDiscoveryQuestion[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/discovery-questions`, {
      headers: getHeaders(true),
    });
    if (!res.ok) return [];
    return res.json();
  },

  // Product Completeness Map (Phase 8)
  async getCompletenessMap(projectId: string): Promise<CompletenessMapData> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/completeness-map`, {
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to load completeness map' }));
      throw new Error(err.detail || 'Failed to load completeness map');
    }
    return res.json();
  },

  async recordCompletenessDecision(
    projectId: string,
    nodeId: string,
    decision: 'approved' | 'dismissed' | 'deferred',
    rationale = ''
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/completeness-map/decisions`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ node_id: nodeId, decision, rationale }),
    });
    if (!res.ok) throw new Error('Failed to record completeness decision');
    return res.json();
  },

  // Project Chat & Tasks (Phase 9)
  async listProjectChats(projectId: string): Promise<ProjectChat[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/chats`, {
      headers: getHeaders(true),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createProjectChat(
    projectId: string,
    title: string,
    chatScope = 'project_wide',
    targetReviewId?: string,
    targetFindingId?: string
  ): Promise<ProjectChat> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/chats`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        title,
        chat_scope: chatScope,
        target_review_id: targetReviewId,
        target_finding_id: targetFindingId,
      }),
    });
    if (!res.ok) throw new Error('Failed to create project chat session');
    return res.json();
  },

  async getProjectChat(projectId: string, chatId: string): Promise<ProjectChat> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/chats/${chatId}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) throw new Error('Chat session not found');
    return res.json();
  },

  async sendProjectChatMessage(projectId: string, chatId: string, content: string): Promise<ProjectChatMessage> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async takeFindingAction(
    projectId: string,
    findingId: string,
    action: 'accept' | 'edit' | 'reject' | 'defer',
    customRecommendation?: string,
    rationale?: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/findings/${findingId}/actions`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        action,
        custom_recommendation: customRecommendation,
        rationale,
      }),
    });
    if (!res.ok) throw new Error('Failed to record finding action');
    return res.json();
  },

  async listImprovementTasks(projectId: string): Promise<ImprovementTask[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
      headers: getHeaders(true),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async updateImprovementTaskStatus(
    projectId: string,
    taskId: string,
    status: 'todo' | 'in_progress' | 'completed'
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update task status');
    return res.json();
  },

  async verifyImprovementTask(projectId: string, taskId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}/verify`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    if (!res.ok) throw new Error('Failed to run task verification');
    return res.json();
  },
  async getFindingCitations(findingId: string): Promise<FindingEvidenceCitation[]> {
    try {
      const res = await fetch(`${API_BASE}/findings/${findingId}/citations`, {
        headers: getHeaders(true),
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async getProjectSnapshot(projectId: string, snapshotId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/snapshots/${snapshotId}`, {
      headers: getHeaders(true),
    });
    if (!res.ok) throw new Error('Failed to retrieve project snapshot');
    return res.json();
  },

  async getBudgets(): Promise<AIBudget[]> {
    const res = await fetch(`${API_BASE}/budgets`, {
      headers: getHeaders(true),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getAccountBudget(): Promise<AIBudget | null> {
    try {
      const res = await fetch(`${API_BASE}/budgets/account`, {
        headers: getHeaders(true),
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async updateBudget(payload: BudgetUpdatePayload): Promise<AIBudget> {
    const res = await fetch(`${API_BASE}/budgets`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update budget' }));
      throw new Error(err.detail || 'Failed to update budget');
    }
    return res.json();
  },

  async getProjectChangelog(projectId: string): Promise<ProjectChangelogEntry[]> {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/changelog`, {
        headers: getHeaders(true),
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async createProjectChangelog(
    projectId: string,
    data: {
      versionTag: string;
      title: string;
      description: string;
      findingId?: string;
      isPublic?: boolean;
    }
  ): Promise<ProjectChangelogEntry> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/changelog`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        version_tag: data.versionTag,
        title: data.title,
        description: data.description,
        finding_id: data.findingId,
        is_public: data.isPublic ?? true,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create changelog entry' }));
      throw new Error(err.detail || 'Failed to create changelog entry');
    }
    return res.json();
  },

  async deleteProjectChangelog(projectId: string, entryId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/changelog/${entryId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return res.ok;
  },
};



