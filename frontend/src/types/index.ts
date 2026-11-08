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

// -----------------------------------------------------------------------------
// Phase 2, 3 & 4 Project Foundation Types
// -----------------------------------------------------------------------------
export type ProjectStatus = 'draft' | 'ready' | 'in_review' | 'reviewed' | 'archived' | 'published';

export type ProjectCategory =
  | 'developer-tools'
  | 'productivity'
  | 'ai-ml'
  | 'design-ux'
  | 'saas-b2b'
  | 'mobile'
  | 'infrastructure'
  | 'education'
  | 'entertainment'
  | 'other';

export interface Project {
  id: string;
  userId: string;
  name: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  status: ProjectStatus;
  isPublic: boolean;
  upvotesCount: number;
  reviewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreatePayload {
  name: string;
  tagline: string;
  category: ProjectCategory;
  description?: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  isPublic?: boolean;
}

export interface ProjectUpdatePayload {
  name?: string;
  tagline?: string;
  description?: string;
  category?: ProjectCategory;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  status?: ProjectStatus;
  isPublic?: boolean;
}

export interface FindingEvidenceCitation {
  id: string;
  findingId?: string;
  sourceId?: string;
  snapshotId?: string;
  chunkId?: string;
  pageNumber?: number | null;
  lineStart?: number | null;
  lineEnd?: number | null;
  charOffsetStart?: number | null;
  charOffsetEnd?: number | null;
  canonicalQuote?: string;
  contentHash?: string;
  validationResult?: 'exact_match' | 'fuzzy_match' | 'hash_verified' | 'unverified';
  createdAt?: string;
  // Fallbacks for direct snake_case properties
  finding_id?: string;
  source_id?: string;
  snapshot_id?: string;
  chunk_id?: string;
  page_number?: number | null;
  line_start?: number | null;
  line_end?: number | null;
  char_offset_start?: number | null;
  char_offset_end?: number | null;
  canonical_quote?: string;
  content_hash?: string;
  validation_result?: 'exact_match' | 'fuzzy_match' | 'hash_verified' | 'unverified';
  created_at?: string;
}

export interface FeedbackFinding {
  id: string;
  reportId: string;
  projectId: string;
  title: string;
  severity: 'blocker' | 'high' | 'medium' | 'low';
  category: 'ux' | 'performance' | 'security' | 'bug' | 'architecture' | 'accessibility';
  observation: string;
  evidenceQuote: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'addressed';
  resolvedAt?: string | null;
  citations?: FindingEvidenceCitation[];
  createdAt: string;
  updatedAt?: string;
}

export interface FeedbackReport {
  id: string;
  reviewId: string;
  projectId: string;
  executiveSummary: string;
  strengthsSummary: string;
  totalFindingsCount: number;
  blockersCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  findings: FeedbackFinding[];
  createdAt: string;
}

export type ReviewLifecycleStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed';

export interface AIReviewStatus {
  id: string;
  projectId: string;
  userId: string;
  status: ReviewLifecycleStatus;
  provider: string;
  modelId: string;
  errorMessage?: string | null;
  executionDurationMs?: number | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface AIReviewStartPayload {
  focus_areas?: string[];
  model_override?: string;
  sync?: boolean;
}

export interface FindingComparisonItem {
  findingId: string;
  title: string;
  severity: 'blocker' | 'high' | 'medium' | 'low';
  category: 'ux' | 'performance' | 'security' | 'bug' | 'architecture' | 'accessibility';
  statusInBase?: 'open' | 'in_progress' | 'addressed' | null;
  statusInTarget: 'open' | 'in_progress' | 'addressed';
  changeType: 'new' | 'resolved' | 'reopened' | 'persisted';
}

export interface FeedbackReportComparison {
  projectId: string;
  baseReportId: string;
  targetReportId: string;
  totalFindingsDelta: number;
  resolvedCount: number;
  newCount: number;
  persistedCount: number;
  items: FindingComparisonItem[];
}

export interface ReportExportResponse {
  projectId: string;
  reportId: string;
  format: string;
  filename: string;
  content: string;
}

export interface PublicProject {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  status: ProjectStatus;
  isPublic: boolean;
  upvotesCount: number;
  reviewsCount: number;
  creatorUsername?: string | null;
  creatorDisplayName?: string | null;
  creatorAvatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicCommentRecent {
  id: string;
  postId: string;
  content: string;
  upvotesCount: number;
  createdAt: string;
  projectTitle: string;
  projectId: string;
  category: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isAnonymous?: boolean;
  userHasUpvoted?: boolean;
}

export interface ProjectApkRelease {
  id: string;
  projectId: string;
  userId: string;
  versionName: string;
  versionCode: number;
  releaseNotes: string;
  fileName: string;
  fileSizeBytes: number;
  fileSha256: string;
  packageName?: string;
  minSdkVersion?: number;
  targetSdkVersion?: number;
  status: 'quarantined' | 'verified' | 'published' | 'revoked';
  quarantineReason?: string | null;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUpvoteResponse {
  projectId: string;
  upvotesCount: number;
  hasUpvoted: boolean;
}

// =============================================================================
// Phase 9: Creator Space Types
// =============================================================================

export interface CreatorProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  skills: string[];
  reputationScore: number;
  joinedAt: string;
}

export interface CreatorProfileUpdatePayload {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  skills?: string[];
}

export interface LaunchReadiness {
  hasAiReview: boolean;
  hasRepoUrl: boolean;
  hasDemoUrl: boolean;
  openBlockersCount: number;
  isLaunchReady: boolean;
}

export interface CreatorShowcaseProject {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  isPublic: boolean;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  upvotesCount: number;
  reviewsCount: number;
  readiness: LaunchReadiness;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorStudioMetrics {
  totalProjectsCount: number;
  publishedProjectsCount: number;
  privateProjectsCount: number;
  totalUpvotesReceived: number;
  totalReviewsCompleted: number;
  totalOpenBlockers: number;
}

export interface CreatorStudioOverview {
  profile: CreatorProfile;
  metrics: CreatorStudioMetrics;
  projects: CreatorShowcaseProject[];
}

export interface PublicCreatorProfile {
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  skills: string[];
  reputationScore: number;
  joinedAt: string;
  totalPublishedProjects: number;
  totalUpvotesReceived: number;
  publishedProjects: PublicProject[];
}

// =============================================================================
// Phase 3 — BYOK Credential Vault & Unified Identity Types
// =============================================================================
export type AIProviderId = 'gemini' | 'groq' | 'nvidia' | 'openrouter';

export type CredentialValidationStatus = 'unverified' | 'valid' | 'invalid' | 'rate_limited';

export interface CredentialMetadata {
  id: string;
  userId: string;
  provider: AIProviderId;
  displayName: string;
  maskedPreview: string;
  isEnabled: boolean;
  validationStatus: CredentialValidationStatus;
  lastTestedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialTestResult {
  success: boolean;
  provider: string;
  status: CredentialValidationStatus;
  message: string;
  latencyMs: number;
}

export interface AuthenticatedPrincipal {
  user_id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  role: string;
  provider: string;
  provider_subject: string;
  email_verified: boolean;
  session_id?: string | null;
  roles: string[];
}

export interface UserIdentity {
  id: string;
  userId: string;
  provider: 'email' | 'google' | 'github';
  providerSubject: string;
  email: string;
  createdAt: string;
}

export interface MFAStatus {
  is_enabled: boolean;
  factor_type: string | null;
}

export interface MFAEnrollmentData {
  factor_id: string;
  secret: string;
  qr_code_uri: string;
}

// =============================================================================
// Phases 4 to 10 — Source Ingestion, RAG, Graph, Tasks, and Chat Types
// =============================================================================

export interface ProjectSource {
  id: string;
  projectId: string;
  ownerId: string;
  sourceType: string;
  name: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  contentText: string;
  metadata?: Record<string, any>;
  version: number;
  isActive: boolean;
  createdAt: string;
}

export interface RetrievedKnowledgeEvidence {
  chunkId: string;
  sourceId: string;
  sourceName: string;
  cleanQuote: string;
  knowledgeBase: 'project' | 'reference';
  score: number;
  relevancePercentage: number;
  pageNumber?: number | null;
  sectionHeading?: string | null;
  lineRange?: string | null;
}

export interface ProjectAIConfig {
  taskType?: string;
  primaryProvider: string;
  fallbackProvider?: string | null;
  modelOverride?: string | null;
  temperature?: number;
  maxTokens?: number;
}

export interface ProjectAIUsageSummary {
  projectId: string;
  totalCalls: number;
  totalTokens: number;
  totalCostUsd: number;
  averageLatencyMs: number;
}

export type CompletenessGapStatus =
  | 'complete'
  | 'incomplete'
  | 'missing'
  | 'contradictory'
  | 'evidenced_present'
  | 'partially_evidenced'
  | 'specified_not_verified'
  | 'not_provided'
  | 'unclear'
  | 'not_verified'
  | 'not_applicable'
  | 'awaiting_author_decision'
  | 'verified_complete'
  | string;

export interface CompletenessNode {
  id: string;
  projectId: string;
  nodeType: string;
  title: string;
  description: string;
  status: CompletenessGapStatus;
  confidenceScore: number;
  sourceChunkIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompletenessEdge {
  id: string;
  projectId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: string;
  createdAt: string;
}

export interface CompletenessMapData {
  summary: {
    totalNodes: number;
    completeCount: number;
    incompleteCount: number;
    missingCount: number;
    contradictoryCount: number;
    completenessPercentage: number;
  };
  graph: {
    nodes: CompletenessNode[];
    edges: CompletenessEdge[];
  };
  hierarchy: Array<{
    tier: string;
    tierLabel: string;
    count: number;
    items: CompletenessNode[];
  }>;
  table: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    confidenceScore: number;
    connectedRelations: number;
    hasGap: boolean;
  }>;
  decisions: Array<{
    id: string;
    projectId: string;
    userId: string;
    nodeId: string;
    decisionType: string;
    rationale: string;
    createdAt: string;
  }>;
}

export interface ProjectChat {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  chatScope: string;
  targetReviewId?: string | null;
  targetFindingId?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: ProjectChatMessage[];
}

export interface ProjectChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Array<{
    source_name?: string;
    sourceName?: string;
    quote?: string;
    clean_quote?: string;
    cleanQuote?: string;
    relevance_percentage?: number;
    relevancePercentage?: number;
    sourceType?: string;
    url?: string;
    domain?: string;
    pageNumber?: number;
    sectionHeading?: string;
  }>;
  classification: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ImprovementTask {
  id: string;
  projectId: string;
  findingId?: string | null;
  title: string;
  description: string;
  actionType: string;
  status: 'todo' | 'in_progress' | 'completed';
  verificationStatus: string;
  verificationFeedback?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuidedDiscoveryQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  recommended: string;
}

export interface AIBudget {
  id: string;
  userId: string;
  projectId?: string | null;
  scope: 'account' | 'project' | 'task';
  monthlyLimitUsd: number;
  currentPeriodSpendUsd: number;
  reservedSpendUsd: number;
  warningThresholdPct: number;
  percentageUsed: number;
  isWarningActive: boolean;
  hardStopEnabled: boolean;
  currentPeriodStart: string;
  updatedAt: string;
}

export interface BudgetUpdatePayload {
  scope?: 'account' | 'project' | 'task';
  projectId?: string | null;
  monthlyLimitUsd: number;
  warningThresholdPct?: number;
  hardStopEnabled?: boolean;
}

export interface ProjectChangelogEntry {
  id: string;
  projectId: string;
  userId: string;
  versionTag: string;
  title: string;
  description: string;
  findingId?: string | null;
  findingTitle?: string | null;
  findingSeverity?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

