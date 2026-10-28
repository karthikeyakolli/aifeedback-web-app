export type PostType =
  | 'product_review'
  | 'idea_critique'
  | 'problem_discovery'
  | 'general_feedback';

export type FeedbackCategory =
  | 'Developer Tools'
  | 'Productivity'
  | 'AI & Machine Learning'
  | 'Design & UX'
  | 'SaaS & B2B'
  | 'Mobile Apps';

export interface Author {
  id?: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isAnonymous: boolean;
  reputationScore?: number;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  postType: PostType;
  productUrl?: string;
  category: FeedbackCategory;
  tags: string[];
  author: Author;
  isAnonymous: boolean;
  upvotesCount: number;
  commentsCount: number;
  hasAiAnalysis: boolean;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  userHasUpvoted?: boolean;
  userHasBookmarked?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  parentCommentId?: string;
  author: Author;
  content: string;
  isAnonymous: boolean;
  upvotesCount: number;
  isHelpfulFlag: boolean;
  createdAt: string;
  updatedAt: string;
  userHasUpvoted?: boolean;
  replies?: Comment[];
}

export interface Citation {
  commentId: string;
  authorDisplay: string;
  quoteSnippet: string;
}

export interface ThemeFinding {
  id: string;
  themeName: string;
  category: 'complaint' | 'praise' | 'feature_request' | 'friction';
  summary: string;
  supportingCommentIds: string[];
  citations: Citation[];
  commentCount: number;
  severity: 'high' | 'medium' | 'low';
}

export interface DisagreementFinding {
  id: string;
  topic: string;
  perspectiveA: string;
  supportingIdsA: string[];
  perspectiveB: string;
  supportingIdsB: string[];
  takeaway: string;
}

export interface RecommendationFinding {
  id: string;
  title: string;
  problemAddressed: string;
  rationale: string;
  suggestedValidation: string;
  supportingCommentIds: string[];
  frequencyScore: number;
  confidence: 'high' | 'medium' | 'low';
  recommendedPriority: 'P0' | 'P1' | 'P2' | 'P3';
}

export interface AIAnalysis {
  id: string;
  postId: string;
  modelVersion: string;
  createdAt: string;
  commentCountAnalyzed: number;
  discussionSummary: string;
  themes: ThemeFinding[];
  disagreements: DisagreementFinding[];
  recommendations: RecommendationFinding[];
  limitationsAndUncertainty: string;
  isCached: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  reputationScore: number;
  joinedAt: string;
}
