# Graph Report - ai web application  (2026-11-09)

## Corpus Check
- 230 files · ~373,803 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 18 file(s) not represented in the graph (top: (none) 10, .css 2, .jsonc 2)

## Summary
- 2841 nodes · 6705 edges · 139 communities (74 shown, 65 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 215 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `03986aae`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- types/index.ts
- AuthContext.tsx
- Button
- test_auth_and_community.py
- lucide-react
- schemas/auth.py
- useAuth
- .retrieve_evidence
- AIOrchestratorService
- schemas/ai.py
- ProjectRepository
- posts.py
- clean_evidence_quote
- report.py
- ReportGenerationService
- create_access_token
- OpenRouterProvider
- WebIntelligenceService
- os
- CredentialVaultService
- projects.py
- get_user_id
- steps
- review_service.py
- SourceIngestionService
- HybridAIProvider
- utc_now_iso
- CommunityRepository
- comments.py
- v1/credentials.py
- v1/creator.py
- test_phase_2_1_reconciliation.py
- react
- DatabaseManager
- typing
- post
- ProjectChatAndWorkflowService
- steps
- test_apk_and_community_voices.py
- test_full_product_review.py
- notifications.py
- BudgetService
- AdvancedRAGEngine
- compilerOptions
- GeminiConfigurationError
- test_phase_8_public_space.py
- v1/dev.py
- CompletenessMapService
- test_phase_2_reliability_and_concurrency.py
- test_phase_4_personal_projects.py
- v1/ai.py
- v1/health.py
- report_generation_service.py
- uuid
- PublicProjectDetailPage.tsx
- get_current_user_required
- flatten_comments_tree
- router.py
- dependencies
- compilerOptions
- TestResearchReportGeneration
- DiscussionRetrievalService
- frontend/package.json
- test_phase_14_closure_verification.py
- package.json
- budgets.py
- ProjectAIReviewEngine
- log_structured_signal
- test_phase_7_e2e_journey.py
- BudgetExceededError
- NvidiaNimProvider
- test_phase_2_engineering_foundation.py
- database.types.ts
- test_phase_4_chat_and_rag.py
- main.py
- ChatMessageRequest
- react-dom
- TestReportManagementAndAccessBoundaries
- test_phase_5_ai_review_engine.py
- vite.config.ts
- ProductDetailPage.tsx
- ProviderPolicyService
- delete_project_source
- fastapi_testclient
- .oxlintrc.json
- scripts
- services
- create_mock_user
- tsconfig.json
- clsx
- @supabase/supabase-js
- tailwind-merge
- tailwindcss@^4.3.3
- three
- TestPDFExportEngine
- auth_service.py
- schemas/auth.py
- v1/auth.py
- check_mfa_status
- test_phases_4_to_10_complete_workflow.py
- database_backup_and_restore.py
- calculate_prioritization_score
- OpenRouterFreeTierViolationError
- test_online_brain_and_discussions.py

## God Nodes (most connected - your core abstractions)
1. `Button` - 92 edges
2. `react` - 90 edges
3. `lucide-react` - 80 edges
4. `CommunityRepository` - 76 edges
5. `useAuth()` - 61 edges
6. `cn()` - 52 edges
7. `react-router-dom` - 52 edges
8. `ProjectRepository` - 46 edges
9. `create_access_token()` - 45 edges
10. `get_user_id()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `seed_demo_data()` --calls--> `hash_password()`  [EXTRACTED]
  scripts/seed_demo_community_data.py → backend/app/services/auth_service.py
- `test_area_10_backup_restoration_integrity()` --calls--> `verify_backup_and_recovery()`  [EXTRACTED]
  backend/tests/test_phase_13_production_readiness.py → scripts/verify_backup_and_recovery.py
- `lifespan()` --calls--> `seed_demo_data()`  [EXTRACTED]
  backend/app/main.py → scripts/seed_demo_community_data.py
- `get_user_public_profile()` --uses--> `PublicUserProfileResponse`  [INFERRED]
  backend/app/api/v1/users.py → backend/app/schemas/auth.py
- `list_project_apk_releases()` --uses--> `ProjectApkReleaseRead`  [INFERRED]
  backend/app/api/v1/projects.py → backend/app/schemas/project.py

## Import Cycles
- None detected.

## Communities (139 total, 65 thin omitted)

### Community 0 - "types/index.ts"
Cohesion: 0.04
Nodes (89): PRESET_QUERIES, ProjectChatTabProps, ProjectCompletenessTab(), ProjectCompletenessTabProps, AVAILABLE_FOCUS_AREAS, ProjectReviewTabProps, ProjectSourcesTab(), ProjectSourcesTabProps (+81 more)

### Community 1 - "AuthContext.tsx"
Cohesion: 0.13
Nodes (16): AuthContext, AuthContextType, AuthProvider(), mockComments, mockCurrentUser, mockPosts, CATEGORIES, CreatePostPage() (+8 more)

### Community 2 - "Button"
Cohesion: 0.09
Nodes (43): App(), AuthModal(), AuthWarningCard(), AuthWarningCardProps, ProtectedRoute(), ProtectedRouteProps, AppLoadingScreen(), AppLoadingScreenProps (+35 more)

### Community 3 - "test_auth_and_community.py"
Cohesion: 0.06
Nodes (14): registered_users(), test_anonymous_post_and_comment_privacy(), test_atomic_post_and_comment_voting(), test_auth_duplicate_email_rejected(), test_auth_invalid_credentials_rejected(), test_auth_me_with_valid_and_invalid_token(), test_bookmarks_persistence(), test_confirm_email_endpoint() (+6 more)

### Community 4 - "lucide-react"
Cohesion: 0.07
Nodes (51): AboutModal(), AboutModalProps, CommandPalette(), Drawer(), DrawerProps, Dropdown, DropdownCheckboxItem, DropdownContent (+43 more)

### Community 5 - "schemas/auth.py"
Cohesion: 0.18
Nodes (4): get_me(), signup(), UserProfileResponse, UserRegisterRequest

### Community 6 - "useAuth"
Cohesion: 0.08
Nodes (49): Badge(), BadgeProps, CommentComposer(), CommentComposerProps, CommentThread(), CommentThreadProps, AgentMode, AIInsightsView() (+41 more)

### Community 7 - ".retrieve_evidence"
Cohesion: 0.13
Nodes (7): extract_keywords(), RetrievalResult, retrieve_evidence(), RetrievedComment, RetrievedThemeMatch, tokenize_text(), test_retrieval_service_produces_clean_evidence()

### Community 8 - "AIOrchestratorService"
Cohesion: 0.08
Nodes (6): RawProjectFindingProposal, StructuredProjectFeedbackProposal, AIOrchestratorService, ComprehensiveIntelligenceService, test_ai_orchestrator_sanitizes_proposals(), test_ai_review_engine_picks_up_vault_byok_credential()

### Community 9 - "schemas/ai.py"
Cohesion: 0.05
Nodes (24): AIAnalysisResponse, GeminiAnalysisOutput, RawRecommendationProposal, RawThemeProposal, AnalysisService, compute_discussion_input_hash(), flatten_comments_tree(), _traverse() (+16 more)

### Community 11 - "posts.py"
Cohesion: 0.07
Nodes (21): bookmark_post(), create_post(), delete_post(), delete_post_document(), get_post(), get_post_document(), get_saved_posts(), list_post_documents() (+13 more)

### Community 12 - "clean_evidence_quote"
Cohesion: 0.09
Nodes (11): clean_evidence_quote(), clean_input_text(), clean_list_items(), clean_output_text(), sanitize_gemini_analysis(), sanitize_research_proposal(), test_ai_orchestrator_byok_vault_integration(), test_ai_orchestrator_deterministic_fallback() (+3 more)

### Community 13 - "report.py"
Cohesion: 0.13
Nodes (8): list_reports(), resolve_report(), submit_report(), toggle_post_lock(), PostLockRequest, ReportCreateRequest, ReportResolveRequest, ReportResponse

### Community 15 - "create_access_token"
Cohesion: 0.09
Nodes (21): create_access_token(), client(), _create_authenticated_user(), test_area_1_account_project_and_task_ai_budget_enforcement(), test_area_2_complete_finding_evidence_traceability(), test_area_3_multimodal_design_and_visual_ai_understanding(), test_area_4_git_private_security_deletion_detection_and_revocation(), test_area_5_snapshot_immutability_and_evidence_reproducibility() (+13 more)

### Community 16 - "OpenRouterProvider"
Cohesion: 0.10
Nodes (5): ResearchAnswerProposal, OpenRouterProvider, test_openrouter_429_automatic_fallback(), test_openrouter_free_tier_enforcement(), test_openrouter_headers()

### Community 18 - "os"
Cohesion: 0.11
Nodes (17): test_area_10_backup_restoration_integrity(), capture_page(), main(), main(), run_capture(), capture_studio_experience(), main(), run_captures() (+9 more)

### Community 19 - "CredentialVaultService"
Cohesion: 0.09
Nodes (3): CredentialVaultService, utc_now_iso(), VaultEncryptionError

### Community 20 - "projects.py"
Cohesion: 0.10
Nodes (34): compare_feedback_reports(), create_project_changelog(), get_project_changelog(), Settings, AIReviewStartRequest, AIReviewStatusResponse, CompletenessDecisionRequest, FeedbackReportComparison (+26 more)

### Community 21 - "get_user_id"
Cohesion: 0.05
Nodes (29): download_project_apk_release(), export_feedback_report(), get_ai_review_status(), get_finding_citations(), get_guided_discovery_questions(), get_latest_feedback_report(), get_product_completeness_map(), get_project() (+21 more)

### Community 22 - "steps"
Cohesion: 0.05
Nodes (39): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+31 more)

### Community 23 - "review_service.py"
Cohesion: 0.05
Nodes (23): ChatMessageResponse, ChatSessionResponse, CitationRecord, CrossSourceComparison, DisagreementFinding, RawDisagreementProposal, RecommendationFinding, ResearchAnswerResponse (+15 more)

### Community 24 - "SourceIngestionService"
Cohesion: 0.09
Nodes (3): SourceIngestionService, validate_external_url(), test_ssrf_protection_rejects_forbidden_and_private_hosts()

### Community 29 - "comments.py"
Cohesion: 0.12
Nodes (13): create_comment(), delete_comment(), get_post_comments(), get_recent_public_comments(), update_comment(), vote_comment(), CommentAuthor, CommentBase (+5 more)

### Community 30 - "v1/credentials.py"
Cohesion: 0.15
Nodes (13): add_credential(), delete_credential(), _extract_user_id(), get_credential(), list_credentials(), rotate_credential(), test_credential(), update_credential() (+5 more)

### Community 31 - "v1/creator.py"
Cohesion: 0.13
Nodes (13): get_creator_studio(), get_public_creator_profile(), get_user_id(), publish_project(), unpublish_project(), update_creator_profile(), CreatorProfileRead, CreatorProfileUpdate (+5 more)

### Community 32 - "test_phase_2_1_reconciliation.py"
Cohesion: 0.06
Nodes (17): create_mock_supabase_token(), get_active_auth_provider(), auth_users(), test_anonymous_comment_privacy(), test_anonymous_post_privacy_and_immutability(), test_atomic_vote_toggling_and_comment_counter_integrity(), test_input_validation_and_url_scheme_protection(), test_moderation_reports_privacy() (+9 more)

### Community 33 - "react"
Cohesion: 0.15
Nodes (23): CommandItem, CommandPaletteProps, AboutSection(), CommunityVoices(), DomainConfig, DOMAINS, ExploreByDomain(), ExploreByDomainProps (+15 more)

### Community 34 - "DatabaseManager"
Cohesion: 0.14
Nodes (4): DatabaseManager, get_db_path(), CreatorRepository, utc_now_iso()

### Community 36 - "post"
Cohesion: 0.06
Nodes (16): create_project(), create_project_chat(), link_project_design(), link_project_repository(), query_project_rag(), record_author_decision(), run_comprehensive_project_audit(), send_project_chat_message() (+8 more)

### Community 38 - "steps"
Cohesion: 0.09
Nodes (24): name, runs-on, steps, name, runs-on, steps, jobs, backend-test (+16 more)

### Community 40 - "test_apk_and_community_voices.py"
Cohesion: 0.20
Nodes (5): auth_headers(), client(), test_apk_release_lifecycle(), test_public_projects_sort_options(), test_recent_comments_endpoint()

### Community 41 - "test_full_product_review.py"
Cohesion: 0.08
Nodes (12): client(), setup_product_data(), test_criterion_11_unauthorized_users_cannot_access_reviews(), test_criterion_12_review_reports_can_be_reopened_and_exported(), test_criterion_1_opening_ai_lab_does_not_make_ai_request(), test_criterion_2_full_review_runs_only_after_explicit_owner_action(), test_criterion_3_all_eligible_product_sources_considered(), test_criterion_4_excluded_sources_are_not_retrieved() (+4 more)

### Community 42 - "notifications.py"
Cohesion: 0.14
Nodes (6): get_notifications(), get_unread_count(), mark_all_read(), mark_read(), NotificationResponse, UnreadCountResponse

### Community 45 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 46 - "GeminiConfigurationError"
Cohesion: 0.05
Nodes (13): generate_full_product_review(), send_chat_message(), send_review_conversation_message(), trigger_post_analysis(), StructuredProductReviewProposal, GeminiConfigurationError, GeminiProvider, GeminiRateLimitError (+5 more)

### Community 47 - "test_phase_8_public_space.py"
Cohesion: 0.12
Nodes (10): community_headers(), create_user(), creator_headers(), ensure_offline_ai(), test_community_upvoting_and_rate_enforcement(), test_direct_public_project_access_and_private_isolation(), test_explicit_publishing_and_revocation_lifecycle(), test_public_feedback_report_access() (+2 more)

### Community 48 - "v1/dev.py"
Cohesion: 0.08
Nodes (26): get_dev_health(), get_dev_quick_token(), manage_synthetic_data(), run_ai_test(), run_evaluation_benchmark(), verify_dev_mode(), AITestCaseRequest, AITestCaseResult (+18 more)

### Community 50 - "test_phase_2_reliability_and_concurrency.py"
Cohesion: 0.07
Nodes (15): ensure_offline_ai(), other_user_auth(), owner_auth(), sample_project(), test_concurrent_simultaneous_review_requests(), test_idempotent_finalization_does_not_duplicate_counters_or_reports(), test_independent_projects_can_run_reviews_concurrently(), test_orphan_in_review_project_recovery() (+7 more)

### Community 51 - "test_phase_4_personal_projects.py"
Cohesion: 0.11
Nodes (9): test_create_project_full_intake_workflow(), test_cross_user_isolation(), test_delete_project_and_cascade(), test_field_validation_boundaries(), test_lifecycle_status_progression(), test_personal_projects_filtering(), test_reopen_and_update_project(), user_a() (+1 more)

### Community 52 - "v1/ai.py"
Cohesion: 0.06
Nodes (25): create_chat_session(), delete_chat_session(), delete_research_report(), download_product_review(), download_research_report(), generate_research_report(), get_chat_session(), get_post_insights() (+17 more)

### Community 53 - "v1/health.py"
Cohesion: 0.21
Nodes (4): get_health(), get_readiness(), root_health(), HealthResponse

### Community 54 - "report_generation_service.py"
Cohesion: 0.16
Nodes (3): ReportPDFRenderer, _sanitize_for_pdf(), _flush_table()

### Community 55 - "uuid"
Cohesion: 0.05
Nodes (21): test_compare_feedback_reports_includes_omitted_findings(), test_budget_reservation_and_hard_stop(), test_decoupled_task_completion_and_insufficient_evidence(), test_immutable_review_snapshot_full_content_and_hashes(), test_project(), test_user(), ensure_offline_ai(), other_user_headers() (+13 more)

### Community 56 - "PublicProjectDetailPage.tsx"
Cohesion: 0.36
Nodes (6): FindingCategory, FindingSeverity, SeverityPill(), SeverityPillProps, PublicProjectDetailPage(), FeedbackReport

### Community 57 - "get_current_user_required"
Cohesion: 0.08
Nodes (14): decode_access_token(), get_current_user_optional(), get_current_user_required(), handle_oauth_callback(), verify_local_token(), verify_supabase_token(), test_cross_user_unauthorized_access_and_mutation(), test_expired_session_token_rejection() (+6 more)

### Community 60 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, lucide-react@^1.63.0, @radix-ui/react-dialog@^1.3.1, @radix-ui/react-dropdown-menu@^2.2.1, @radix-ui/react-popover@^1.3.1, @radix-ui/react-tabs@^1.2.1, @radix-ui/react-tooltip@^1.4.1, react@^19.3.1 (+8 more)

### Community 61 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 64 - "frontend/package.json"
Cohesion: 0.17
Nodes (15): devDependencies, oxlint@^1.89.0, @types/node@^24.19.2, @types/react@^19.3.0, @types/react-dom@^19.3.0, typescript@~7.0.2, name, private (+7 more)

### Community 65 - "test_phase_14_closure_verification.py"
Cohesion: 0.15
Nodes (8): client(), _create_user(), test_ai_budgets_api_lifecycle(), test_cross_tenant_isolation_on_budgets_and_snapshots(), test_finding_evidence_citations_lifecycle(), test_health_liveness_and_readiness_probes(), test_immutable_project_snapshot_retrieval(), test_public_space_read_only_invariance()

### Community 66 - "package.json"
Cohesion: 0.13
Nodes (14): author, description, keywords, license, name, private, scripts, build (+6 more)

### Community 67 - "budgets.py"
Cohesion: 0.21
Nodes (6): BudgetResponse, BudgetUpdateRequest, get_account_budget(), get_user_id(), list_user_budgets(), update_budget()

### Community 69 - "log_structured_signal"
Cohesion: 0.11
Nodes (4): log_structured_signal(), ReviewWorker, heartbeat_worker(), test_atomic_review_finalization_success()

### Community 70 - "test_phase_7_e2e_journey.py"
Cohesion: 0.21
Nodes (5): create_test_user(), ensure_offline_ai(), test_complete_end_to_end_personal_journey(), test_reliability_and_idempotent_recovery(), test_security_adversarial_and_isolation_attacks()

### Community 73 - "NvidiaNimProvider"
Cohesion: 0.16
Nodes (3): NvidiaNimProvider, test_nvidia_nim_markdown_fence_cleaning(), test_nvidia_nim_provider_headers()

### Community 75 - "database.types.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 76 - "test_phase_4_chat_and_rag.py"
Cohesion: 0.12
Nodes (8): client(), setup_test_database(), test_bm25_keyword_retrieval_ranking(), test_chat_session_unauthenticated_returns_401(), test_cross_post_evidence_isolation(), test_insufficient_evidence_detection(), test_product_suggestions_generation(), test_retrieval_precision_recall_benchmark()

### Community 79 - "main.py"
Cohesion: 0.08
Nodes (12): create_application(), lifespan(), client(), test_ai_testing_lab_complaints(), test_ai_testing_lab_empty_input_robustness(), test_ai_testing_lab_prompt_injection_robustness(), test_dev_endpoints_forbidden_in_production(), test_dev_health_telemetry() (+4 more)

### Community 84 - "test_phase_5_ai_review_engine.py"
Cohesion: 0.13
Nodes (8): ensure_offline_ai(), other_user_headers(), owner_headers(), test_ai_review_context_validation_boundary(), test_ai_review_lifecycle_and_structured_report(), test_ai_review_ownership_isolation(), test_finding_status_lifecycle_progression(), test_list_historical_reviews()

### Community 85 - "vite.config.ts"
Cohesion: 0.25
Nodes (6): @tailwindcss/vite@^4.3.3, vite@^8.3.5, @vitejs/plugin-react@^6.1.2, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 86 - "ProductDetailPage.tsx"
Cohesion: 0.11
Nodes (30): EmptyState(), EmptyStateProps, CardSkeleton(), FeedSkeleton(), FormSkeleton(), PageSkeleton(), Skeleton(), SkeletonProps (+22 more)

### Community 88 - "delete_project_source"
Cohesion: 0.29
Nodes (3): delete_project(), delete_project_changelog(), delete_project_source()

### Community 89 - "fastapi_testclient"
Cohesion: 0.11
Nodes (7): test_api_v1_health_endpoint(), test_cors_headers_configured(), test_nonexistent_route_returns_404(), test_post_insights_returns_expected_phase1_status(), test_root_health_endpoint(), test_moderation_report_submission_and_resolution(), test_notifications_lifecycle()

### Community 91 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 93 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 97 - "services"
Cohesion: 0.14
Nodes (13): key, sync, value, services, buildCommand, env, envVars, healthCheckPath (+5 more)

### Community 98 - "create_mock_user"
Cohesion: 0.19
Nodes (6): create_auth_headers(), create_mock_user(), test_chat_session_lifecycle_and_ownership_isolation(), test_citation_hallucination_pruning_in_chat(), test_prompt_injection_in_comments_defended(), test_suggestions_endpoint()

### Community 124 - "auth_service.py"
Cohesion: 0.06
Nodes (20): compute_totp_code(), confirm_password_reset(), enroll_user_mfa(), hash_password(), request_password_reset(), verify_password(), verify_totp_code(), verify_user_mfa() (+12 more)

### Community 125 - "schemas/auth.py"
Cohesion: 0.11
Nodes (12): confirm_reset(), enroll_mfa(), oauth_callback(), request_reset(), AuthenticatedPrincipal, AuthTokenResponse, MFAEnrollResponse, OAuthCallbackPayload (+4 more)

### Community 130 - "v1/auth.py"
Cohesion: 0.11
Nodes (10): confirm_email_endpoint(), _confirm_supabase_user_by_email(), EmailConfirmPayload, get_auth_config(), get_current_principal(), list_linked_identities(), login(), logout() (+2 more)

### Community 133 - "check_mfa_status"
Cohesion: 0.17
Nodes (7): check_mfa_status(), unenroll_mfa(), verify_mfa(), MFAStatusResponse, MFAVerifyPayload, get_user_mfa_status(), unenroll_user_mfa()

### Community 134 - "test_phases_4_to_10_complete_workflow.py"
Cohesion: 0.09
Nodes (4): auth_headers(), ensure_offline_ai(), intruder_headers(), test_project()

### Community 136 - "database_backup_and_restore.py"
Cohesion: 0.15
Nodes (6): main(), create_backup(), ensure_backup_dir(), list_backups(), restore_backup(), verify_database_integrity()

### Community 141 - "calculate_prioritization_score"
Cohesion: 0.15
Nodes (5): calculate_prioritization_score(), PrioritizationScoreBreakdown, ProductSuggestionService, test_deterministic_scoring_formula(), test_severity_keyword_detection()

### Community 145 - "test_online_brain_and_discussions.py"
Cohesion: 0.12
Nodes (9): audit_and_moderate_content(), _signup_user(), test_moderation_shield_and_spam_detection(), test_multi_grounded_project_chat_with_brain(), test_project_changelog_lifecycle(), test_project_review_notifications(), test_recent_comments_discussion_feed_filtering(), test_similar_projects_ecosystem_cross_referencing() (+1 more)

## Knowledge Gaps
- **65 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CommunityRepository` connect `CommunityRepository` to `.update_research_report`, `.get_comment`, `._serialize_product_review`, `._serialize_post`, `.create_user`, `utc_now_iso`, `Any`, `auth_service.py`, `.create_chat_session`, `.save_analysis_run`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0384391380314502 - nodes in this community are weakly interconnected._
- **Why does `ProjectRepository` connect `ProjectRepository` to `typing`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1286549707602339 - nodes in this community are weakly interconnected._
- **Why does `clean_evidence_quote()` connect `clean_evidence_quote` to `typing`, `ProjectChatAndWorkflowService`, `test_phases_4_to_10_complete_workflow.py`, `.retrieve_evidence`, `AIOrchestratorService`, `AdvancedRAGEngine`, `CompletenessMapService`, `WebIntelligenceService`, `review_service.py`, `SourceIngestionService`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.09121909633418585 - nodes in this community are weakly interconnected._
- **Should `test_auth_and_community.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._