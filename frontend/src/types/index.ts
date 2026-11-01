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
  status: 'published' | 'draft' | 'archived' | 'locked' | 'hidden';
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
  sourceType?: 'comment' | 'document';
  filename?: string;
  pageNumber?: number;
  section?: string;
}

export type CitationRecord = Citation;

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
  totalCommentsAvailable?: number;
  discussionSummary: string;
  themes: ThemeFinding[];
  disagreements: DisagreementFinding[];
  recommendations: RecommendationFinding[];
  limitationsAndUncertainty: string;
  isCached: boolean;
  isStale?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  reputationScore: number;
  isModerator?: boolean;
  joinedAt: string;
}

export interface ReportPayload {
  targetType: 'post' | 'comment';
  targetId: string;
  reason: string;
  description?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: UserProfile;
}

// =============================================================================
// Phase 4: Conversational Research Assistant & Suggestion Types
// =============================================================================

export interface ChatSession {
  id: string;
  postId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export type AgentMode = 'analytical' | 'professional' | 'visual' | 'explorer';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  citations: CitationRecord[];
  metadata?: {
    observed_facts?: string[];
    hypotheses?: string[];
    limitations?: string;
    suggested_follow_ups?: string[];
    has_sufficient_evidence?: boolean;
    resolved_query?: string;
    executive_summary?: string;
    key_findings?: string[];
    cross_source_comparison?: CrossSourceComparison;
    recommendations?: StructuredRecommendation[];
    stages_completed?: string[];
    agent_mode?: AgentMode;
    visual_diagram?: string;
    ui_mockup_concept?: string;
    image_prompt?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export interface CrossSourceComparison {
  agreement: string[];
  contradiction: string[];
  missingDocumentation: string[];
  unverifiedAssumptions: string[];
}

export interface StructuredRecommendation {
  action: string;
  reason: string;
  evidence: string;
  applicability: string;
  suggestedSuccessMeasure: string;
  missingInformation?: string;
}

export interface ResearchAnswerResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  directAnswer?: string;
  executiveSummary?: string;
  keyFindings?: string[];
  observedFacts: string[];
  hypotheses: string[];
  crossSourceComparison?: CrossSourceComparison;
  recommendations?: StructuredRecommendation[];
  limitations: string;
  suggestedFollowUps: string[];
  hasSufficientEvidence: boolean;
  communityEvidence?: CitationRecord[];
  documentEvidence?: CitationRecord[];
  stagesCompleted?: string[];
  agentMode?: AgentMode;
  visualDiagram?: string;
  uiMockupConcept?: string;
  imagePrompt?: string;
  deterministicMetrics?: {
    totalCommentsInPost?: number;
    totalAttachedDocuments?: number;
    retrievedEvidenceCount?: number;
    citedCommentsCount?: number;
    citedDocumentsCount?: number;
    sourceTypeUsed?: string;
    [key: string]: any;
  };
}

export interface ScoreBreakdown {
  frequency: number;
  severity: number;
  consensus: number;
  confidence: number;
  totalScore: number;
}

export interface ProductSuggestion {
  id: string;
  title: string;
  category: string;
  problemIdentified: string;
  proposedInvestigation: string;
  rationale: string;
  evidenceCitations: CitationRecord[];
  uniqueMentionCount: number;
  scoreBreakdown: ScoreBreakdown;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  confidence: 'high' | 'medium' | 'low';
  metricOfSuccess: string;
  limitations: string;
}

// =============================================================================
// Phase 5: Research Reports & PRD Documents
// =============================================================================

export type ResearchReportType =
  | 'analytical_report'
  | 'executive_summary'
  | 'prd'
  | 'engineering_ticket'
  | 'ux_brief'
  | 'improvement_roadmap'
  | 'engineering_investigation';

export interface ResearchReport {
  id: string;
  postId: string;
  ownerId: string;
  reportType: ResearchReportType;
  title: string;
  contentMarkdown: string;
  status: 'completed' | 'draft' | 'failed';
  sourceAnalysisId?: string;
  version: number;
  metadata: {
    wordCount?: number;
    charCount?: number;
    commentCount?: number;
    customFocus?: string;
    hasAiAnalysis?: boolean;
    suggestionCount?: number;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReportGeneratePayload {
  reportType: ResearchReportType;
  customFocus?: string;
  title?: string;
}

export interface ReportUpdatePayload {
  title?: string;
  contentMarkdown?: string;
}

// =============================================================================
// Phase 6: Real-time Notifications & Moderation Types
// =============================================================================

export interface AppNotification {
  id: string;
  userId: string;
  actorId?: string;
  actorUsername?: string;
  actorDisplayName?: string;
  actorAvatar?: string;
  type: 'reply' | 'comment' | 'ai_ready' | 'upvote' | 'moderation' | 'system';
  title: string;
  message: string;
  linkUrl: string;
  isRead: boolean;
  createdAt: string;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  reporterUsername: string;
  reporterDisplayName: string;
  targetType: 'post' | 'comment';
  targetId: string;
  targetPreview?: string;
  targetStatus?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

// =============================================================================
// Phase 7: Project Documents & Owner Personal Workspace
// =============================================================================

export interface PostDocument {
  id: string;
  postId: string;
  ownerId: string;
  filename: string;
  fileType: 'pdf' | 'markdown' | 'text' | string;
  fileSize: number;
  characterCount: number;
  contentText?: string;
  createdAt: string;
  status?: 'ready' | 'uploading' | 'extracting' | 'indexing' | 'failed' | 'reprocessing';
  isActiveInContext?: boolean;
}

// =============================================================================
// Phase 2: Product Discovery & Community Catalog Types
// =============================================================================

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: FeedbackCategory;
  productUrl?: string;
  logoUrl?: string;
  author: Author;
  discussionCount: number;
  totalReviews: number;
  upvotesCount: number;
  tags: string[];
  features?: string[];
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Phase 5: Developer Workspace, AI Testing Lab & Evaluation Types
// =============================================================================

export interface ProviderHealth {
  provider: string;
  status: 'configured' | 'unconfigured' | 'degraded';
  model: string;
  api_key_configured: boolean;
  latency_ms?: number;
  last_checked?: string;
}

export interface RecentAIRun {
  id: string;
  post_id: string;
  post_title?: string;
  provider: string;
  model: string;
  status: string;
  analyzed_comment_count: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface DevHealth {
  status: string;
  environment: string;
  app_version: string;
  auth_mode: string;
  frontend: {
    status: string;
    vite_server: string;
    framework: string;
  };
  backend: {
    status: string;
    host: string;
    port: number;
    api_prefix: string;
    framework: string;
  };
  database: {
    engine: string;
    status: string;
    posts_count: number;
    comments_count: number;
    documents_count: number;
    reports_count: number;
  };
  gemini_provider: ProviderHealth;
  groq_provider: ProviderHealth;
  synthetic_data_status: SyntheticDataStats;
  recent_runs: RecentAIRun[];
  recent_errors: Array<{ timestamp: string; source: string; message: string }>;
}

export interface RetrievedEvidenceItem {
  id: string;
  type: 'comment' | 'document_chunk';
  source_title: string;
  snippet: string;
  similarity_score: number;
  relevance_reason?: string;
}

export interface CitationVerification {
  id: string;
  type: string;
  verified: boolean;
  snippet: string;
  source_title: string;
}

export interface AITestCaseResult {
  test_id: string;
  category: string;
  status: 'pass' | 'warn' | 'fail';
  execution_latency_ms: number;
  provider_used: string;
  model_used: string;
  inputs: {
    category: string;
    query: string;
    post_id?: string;
    source_filter?: string;
    provider?: string;
  };
  retrieved_evidence: RetrievedEvidenceItem[];
  generated_response: string;
  citations: CitationVerification[];
  validation: {
    citation_accuracy: number;
    groundedness_score: number;
    unsupported_claims_count: number;
    evidence_coverage?: number;
    outcome_explanation: string;
  };
  errors: string[];
}

export interface EvaluationMetric {
  name: string;
  score: number;
  scale: string;
  metric_type: 'automated' | 'benchmark' | 'human_relevance';
  description: string;
}

export interface ProviderComparisonStat {
  provider: string;
  model: string;
  avg_latency_ms: number;
  retrieval_mrr: number;
  citation_correctness_rate: number;
  groundedness_score: number;
  unsupported_claim_rate: number;
  failure_rate: number;
}

export interface EvaluationBenchmark {
  timestamp: string;
  total_cases: number;
  passed_cases: number;
  metrics: EvaluationMetric[];
  retrieval_recall_at_5: number;
  retrieval_mrr: number;
  citation_correctness_rate: number;
  evidence_coverage: number;
  groundedness_score: number;
  unsupported_claim_rate: number;
  human_relevance_rating: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  provider_failure_rate: number;
  schema_validation_failure_rate: number;
  case_results: Array<Record<string, any>>;
  provider_comparison: ProviderComparisonStat[];
}

export interface SyntheticDataStats {
  is_seeded: boolean;
  post_count: number;
  comment_count: number;
  document_count: number;
  synthetic_posts: Array<{
    id: string;
    title: string;
    category: string;
    comments_count: number;
    upvotes_count: number;
    created_at: string;
  }>;
}

export interface SyntheticDataActionResponse {
  action: string;
  success: boolean;
  message: string;
  stats: SyntheticDataStats;
  fixtures_json?: Record<string, any>;
}

// =============================================================================
// Full Product Review & Review-Linked Research Conversation Types
// =============================================================================

export interface ReviewFinding {
  id: string;
  title: string;
  explanation: string;
  interpretation: string;
  recommendation?: string;
  uncertainty?: string;
  supportingCommentIds: string[];
  citations: Citation[];
  evidenceCount: number;
}

export interface StructuredProductReview {
  executiveOverview: string;
  productUnderstanding: string;
  keyHighlights: string[];
  productStrengths: ReviewFinding[];
  customerPainPoints: ReviewFinding[];
  featureRequests: ReviewFinding[];
  userExperienceAssessment: string;
  feedbackPatterns: string[];
  documentationAlignment: {
    agreement: string[];
    contradiction: string[];
    missingDocumentation: string[];
    unverifiedAssumptions: string[];
  };
  improvementOpportunities: string[];
  recommendations: Array<{
    action: string;
    reason: string;
    evidence: string;
    applicability: string;
    suggestedSuccessMeasure: string;
    missingInformation?: string;
  }>;
  evidenceGaps: string;
  overallAssessment: string;
}

export interface ProductReview {
  id: string;
  postId: string;
  ownerId: string;
  version: number;
  status: string;
  provider: string;
  model: string;
  sourceSnapshot: {
    comment_ids?: string[];
    doc_ids?: string[];
    comment_count?: number;
    document_count?: number;
    source_type?: string;
    included_doc_ids?: string[] | null;
    timestamp?: string;
    [key: string]: any;
  };
  contentMarkdown: string;
  structuredOutput?: StructuredProductReview;
  citations: Citation[];
  deterministicStats: {
    totalSourcesConsidered: number;
    commentsAnalyzed: number;
    documentsAnalyzed: number;
    uniqueCitedSourcesCount: number;
    coverageRatio: number;
    strengthsCount: number;
    painPointsCount: number;
    featureRequestsCount: number;
    recommendationsCount: number;
    [key: string]: any;
  };
  stagesCompleted: string[];
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  linkedSessionId?: string;
}

export interface DocumentSourceInfo {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  characterCount: number;
  createdAt: string;
}

export interface ReviewSourceAvailability {
  totalComments: number;
  totalDocuments: number;
  documents: DocumentSourceInfo[];
  latestReviewId?: string | null;
  latestReviewVersion?: number | null;
  latestReviewCreatedAt?: string | null;
  hasNewActivitySinceLastReview: boolean;
  newCommentsCountSinceLastReview: number;
  newDocumentsCountSinceLastReview: number;
}

export interface GenerateReviewRequest {
  sourceType?: 'both' | 'community' | 'documents';
  includeCommunity?: boolean;
  includedDocIds?: string[] | null;
}








