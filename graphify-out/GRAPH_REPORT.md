# Graph Report - ai web application  (2026-11-07)

## Corpus Check
- 229 files · ~370,024 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 6, .css 2, .example 1)

## Summary
- 2820 nodes · 6670 edges · 130 communities (74 shown, 56 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 256 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `884c4d7c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- types/index.ts
- lucide-react
- Button
- test_auth_and_community.py
- lucide-react
- v1/auth.py
- useAuth
- .retrieve_evidence
- AIOrchestratorService
- schemas/ai.py
- ProjectRepository
- posts.py
- v1/ai.py
- report.py
- ReportGenerationService
- pytest
- OpenRouterProvider
- WebIntelligenceService
- os
- CredentialVaultService
- project.py
- get_user_id
- steps
- v1/ai.py
- SourceIngestionService
- projects.py
- utc_now_iso
- CommunityRepository
- comments.py
- v1/credentials.py
- v1/creator.py
- auth_service.py
- react
- DatabaseManager
- clean_evidence_quote
- post
- ProjectChatAndWorkflowService
- steps
- database_backup_and_restore.py
- create_access_token
- uuid
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
- ProjectAIReviewEngine
- create_application
- ResearchChatService
- ExplorePage.tsx
- ReviewService
- test_online_brain_and_discussions.py
- NvidiaNimProvider
- test_phase_6_feedback_report.py
- dependencies
- compilerOptions
- TestResearchReportGeneration
- test_phase_9_creator_space.py
- frontend/package.json
- test_phase_14_closure_verification.py
- package.json
- budgets.py
- GeminiAnalysisOutput
- log_structured_signal
- test_phase_7_e2e_journey.py
- test_phase_4_chat_and_rag.py
- test_apk_and_community_voices.py
- test_phase_2_engineering_foundation.py
- database.types.ts
- create_mock_user
- repository.py
- ProjectApkReleaseRead
- ComprehensiveIntelligenceService
- TestReportManagementAndAccessBoundaries
- test_phase_5_ai_review_engine.py
- vite.config.ts
- ProductDetailPage.tsx
- ProviderPolicyService
- delete_project_source
- test_phase_3_saas_auth_and_multitenancy.py
- decode_access_token
- .oxlintrc.json
- Any
- scripts
- services
- post
- tsconfig.json
- clsx
- @supabase/supabase-js
- tailwind-merge
- tailwindcss@^4.3.3
- three
- TestPDFExportEngine
- StructuredProjectFeedbackProposal
- users.py
- get_active_auth_provider
- oauth_callback
- unenroll_mfa
- setup_test_database

## God Nodes (most connected - your core abstractions)
1. `Button` - 92 edges
2. `react` - 89 edges
3. `lucide-react` - 79 edges
4. `CommunityRepository` - 76 edges
5. `useAuth()` - 61 edges
6. `cn()` - 52 edges
7. `react-router-dom` - 51 edges
8. `ProjectRepository` - 46 edges
9. `create_access_token()` - 45 edges
10. `get_user_id()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `test_area_10_backup_restoration_integrity()` --calls--> `verify_backup_and_recovery()`  [EXTRACTED]
  backend/tests/test_phase_13_production_readiness.py → scripts/verify_backup_and_recovery.py
- `send_chat_message()` --uses--> `ChatMessageRequest`  [INFERRED]
  backend/app/api/v1/ai.py → backend/app/schemas/ai.py
- `send_review_conversation_message()` --uses--> `ChatMessageRequest`  [INFERRED]
  backend/app/api/v1/ai.py → backend/app/schemas/ai.py
- `list_chat_sessions()` --uses--> `ChatSessionResponse`  [INFERRED]
  backend/app/api/v1/ai.py → backend/app/schemas/ai.py
- `rename_chat_session()` --uses--> `ChatSessionResponse`  [INFERRED]
  backend/app/api/v1/ai.py → backend/app/schemas/ai.py

## Import Cycles
- None detected.

## Communities (130 total, 56 thin omitted)

### Community 0 - "types/index.ts"
Cohesion: 0.04
Nodes (86): PRESET_QUERIES, ProjectChatTabProps, ProjectCompletenessTabProps, AVAILABLE_FOCUS_AREAS, ProjectReviewTabProps, ProjectSourcesTabProps, ProjectTasksTabProps, clearStoredToken() (+78 more)

### Community 1 - "lucide-react"
Cohesion: 0.10
Nodes (33): ProtectedRoute(), ProtectedRouteProps, AppLoadingScreen(), AppLoadingScreenProps, CommandItem, CommandPalette(), CommandPaletteProps, ThemeSwitcher() (+25 more)

### Community 2 - "Button"
Cohesion: 0.10
Nodes (41): App(), AuthModal(), Button, ButtonProps, DeveloperWorkspace(), ProjectCompletenessTab(), ProjectReviewTab(), ProjectSourcesTab() (+33 more)

### Community 3 - "test_auth_and_community.py"
Cohesion: 0.07
Nodes (13): registered_users(), test_anonymous_post_and_comment_privacy(), test_atomic_post_and_comment_voting(), test_auth_duplicate_email_rejected(), test_auth_invalid_credentials_rejected(), test_auth_me_with_valid_and_invalid_token(), test_bookmarks_persistence(), test_create_and_retrieve_post() (+5 more)

### Community 4 - "lucide-react"
Cohesion: 0.09
Nodes (39): AboutModal(), AboutModalProps, Drawer(), DrawerProps, Dropdown, DropdownCheckboxItem, DropdownContent, DropdownGroup (+31 more)

### Community 5 - "v1/auth.py"
Cohesion: 0.19
Nodes (12): signup(), AuthenticatedPrincipal, AuthTokenResponse, MFAEnrollResponse, MFAStatusResponse, MFAVerifyPayload, OAuthCallbackPayload, PasswordResetConfirmPayload (+4 more)

### Community 6 - "useAuth"
Cohesion: 0.09
Nodes (44): Card(), CardProps, CommentComposer(), CommentComposerProps, CommentThread(), CommentThreadProps, AgentMode, AIInsightsView() (+36 more)

### Community 7 - ".retrieve_evidence"
Cohesion: 0.12
Nodes (7): DiscussionRetrievalService, extract_keywords(), RetrievalResult, RetrievedComment, RetrievedThemeMatch, tokenize_text(), test_conversational_pronoun_expansion()

### Community 9 - "schemas/ai.py"
Cohesion: 0.05
Nodes (22): AIAnalysisResponse, RawThemeProposal, AnalysisService, compute_discussion_input_hash(), flatten_comments_tree(), _traverse(), InsufficientFeedbackError, MockGeminiProvider (+14 more)

### Community 11 - "posts.py"
Cohesion: 0.07
Nodes (21): bookmark_post(), create_post(), delete_post(), delete_post_document(), get_post(), get_post_document(), get_saved_posts(), list_post_documents() (+13 more)

### Community 12 - "v1/ai.py"
Cohesion: 0.06
Nodes (20): delete_chat_session(), delete_research_report(), download_product_review(), download_research_report(), generate_research_report(), get_chat_session(), get_post_insights(), get_product_review() (+12 more)

### Community 13 - "report.py"
Cohesion: 0.08
Nodes (11): list_reports(), resolve_report(), submit_report(), toggle_post_lock(), NotificationResponse, UnreadCountResponse, PostLockRequest, ReportCreateRequest (+3 more)

### Community 14 - "ReportGenerationService"
Cohesion: 0.09
Nodes (5): ResearchReportType, ReportGenerationService, ReportPDFRenderer, _sanitize_for_pdf(), _flush_table()

### Community 15 - "pytest"
Cohesion: 0.06
Nodes (22): BudgetExceededError, validate_external_url(), test_api_v1_health_endpoint(), test_cors_headers_configured(), test_nonexistent_route_returns_404(), test_post_insights_returns_expected_phase1_status(), test_root_health_endpoint(), test_moderation_report_submission_and_resolution() (+14 more)

### Community 16 - "OpenRouterProvider"
Cohesion: 0.08
Nodes (6): OpenRouterFreeTierViolationError, OpenRouterProvider, clean_input_text(), test_openrouter_429_automatic_fallback(), test_openrouter_free_tier_enforcement(), test_openrouter_headers()

### Community 18 - "os"
Cohesion: 0.07
Nodes (16): capture_page(), main(), main(), run_capture(), capture_studio_experience(), main(), run_captures(), run_captures() (+8 more)

### Community 19 - "CredentialVaultService"
Cohesion: 0.09
Nodes (3): CredentialVaultService, utc_now_iso(), VaultEncryptionError

### Community 20 - "project.py"
Cohesion: 0.12
Nodes (20): create_project_chat(), query_project_rag(), send_project_chat_message(), AIReviewStatusResponse, FeedbackReportRead, FindingEvidenceCitationRead, FindingRead, FindingStatusUpdate (+12 more)

### Community 21 - "get_user_id"
Cohesion: 0.07
Nodes (21): delete_project(), download_project_apk_release(), get_ai_review_status(), get_finding_citations(), get_guided_discovery_questions(), get_latest_feedback_report(), get_product_completeness_map(), get_project() (+13 more)

### Community 22 - "steps"
Cohesion: 0.06
Nodes (36): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+28 more)

### Community 23 - "v1/ai.py"
Cohesion: 0.05
Nodes (32): create_chat_session(), ChatMessageRequest, ChatMessageResponse, ChatSessionCreateRequest, ChatSessionResponse, ChatSessionUpdateRequest, CitationRecord, CrossSourceComparison (+24 more)

### Community 25 - "projects.py"
Cohesion: 0.10
Nodes (16): compare_feedback_reports(), create_project_changelog(), export_feedback_report(), get_project_changelog(), get_public_feedback_report(), get_public_project(), list_public_projects(), set_project_ai_config() (+8 more)

### Community 29 - "comments.py"
Cohesion: 0.12
Nodes (13): create_comment(), delete_comment(), get_post_comments(), get_recent_public_comments(), update_comment(), vote_comment(), CommentAuthor, CommentBase (+5 more)

### Community 30 - "v1/credentials.py"
Cohesion: 0.15
Nodes (13): add_credential(), delete_credential(), _extract_user_id(), get_credential(), list_credentials(), rotate_credential(), test_credential(), update_credential() (+5 more)

### Community 31 - "v1/creator.py"
Cohesion: 0.13
Nodes (13): get_creator_studio(), get_public_creator_profile(), get_user_id(), publish_project(), unpublish_project(), update_creator_profile(), CreatorProfileRead, CreatorProfileUpdate (+5 more)

### Community 32 - "auth_service.py"
Cohesion: 0.06
Nodes (20): compute_totp_code(), enroll_user_mfa(), hash_password(), request_password_reset(), verify_password(), verify_totp_code(), verify_user_mfa(), main() (+12 more)

### Community 33 - "react"
Cohesion: 0.17
Nodes (21): AboutSection(), CommunityVoices(), DomainConfig, DOMAINS, ExploreByDomain(), ExploreByDomainProps, Hero3D(), HomeFooter() (+13 more)

### Community 34 - "DatabaseManager"
Cohesion: 0.14
Nodes (4): DatabaseManager, get_db_path(), CreatorRepository, utc_now_iso()

### Community 35 - "clean_evidence_quote"
Cohesion: 0.12
Nodes (4): clean_evidence_quote(), clean_list_items(), clean_output_text(), test_clean_evidence_quote_strips_all_symbols()

### Community 36 - "post"
Cohesion: 0.08
Nodes (15): create_project(), link_project_design(), link_project_repository(), record_author_decision(), run_comprehensive_project_audit(), take_finding_action(), upload_project_apk_release(), upload_project_source_file() (+7 more)

### Community 38 - "steps"
Cohesion: 0.09
Nodes (24): name, runs-on, steps, name, runs-on, steps, jobs, backend-test (+16 more)

### Community 39 - "database_backup_and_restore.py"
Cohesion: 0.29
Nodes (5): create_backup(), ensure_backup_dir(), list_backups(), restore_backup(), verify_database_integrity()

### Community 40 - "create_access_token"
Cohesion: 0.04
Nodes (25): create_access_token(), test_compare_feedback_reports_includes_omitted_findings(), client(), setup_product_data(), test_criterion_11_unauthorized_users_cannot_access_reviews(), test_criterion_12_review_reports_can_be_reopened_and_exported(), test_criterion_1_opening_ai_lab_does_not_make_ai_request(), test_criterion_2_full_review_runs_only_after_explicit_owner_action() (+17 more)

### Community 41 - "uuid"
Cohesion: 0.04
Nodes (28): create_mock_supabase_token(), test_ai_orchestrator_byok_vault_integration(), test_ai_orchestrator_deterministic_fallback(), test_ai_orchestrator_token_usage_ledger_recording(), test_retrieval_service_produces_clean_evidence(), test_source_ingestion_preserves_canonical_verbatim_raw_text(), test_budget_reservation_and_hard_stop(), test_decoupled_task_completion_and_insufficient_evidence() (+20 more)

### Community 42 - "notifications.py"
Cohesion: 0.18
Nodes (4): get_notifications(), get_unread_count(), mark_all_read(), mark_read()

### Community 45 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 46 - "GeminiConfigurationError"
Cohesion: 0.05
Nodes (16): generate_full_product_review(), send_chat_message(), send_review_conversation_message(), trigger_post_analysis(), ResearchAnswerProposal, GeminiConfigurationError, GeminiProvider, GeminiRateLimitError (+8 more)

### Community 47 - "test_phase_8_public_space.py"
Cohesion: 0.12
Nodes (10): community_headers(), create_user(), creator_headers(), ensure_offline_ai(), test_community_upvoting_and_rate_enforcement(), test_direct_public_project_access_and_private_isolation(), test_explicit_publishing_and_revocation_lifecycle(), test_public_feedback_report_access() (+2 more)

### Community 48 - "v1/dev.py"
Cohesion: 0.06
Nodes (33): get_dev_health(), get_dev_quick_token(), manage_synthetic_data(), run_ai_test(), run_evaluation_benchmark(), verify_dev_mode(), AITestCaseRequest, AITestCaseResult (+25 more)

### Community 50 - "test_phase_2_reliability_and_concurrency.py"
Cohesion: 0.06
Nodes (16): StaleLeaseError, ensure_offline_ai(), other_user_auth(), owner_auth(), sample_project(), test_concurrent_simultaneous_review_requests(), test_idempotent_finalization_does_not_duplicate_counters_or_reports(), test_independent_projects_can_run_reviews_concurrently() (+8 more)

### Community 51 - "test_phase_4_personal_projects.py"
Cohesion: 0.11
Nodes (9): test_create_project_full_intake_workflow(), test_cross_user_isolation(), test_delete_project_and_cascade(), test_field_validation_boundaries(), test_lifecycle_status_progression(), test_personal_projects_filtering(), test_reopen_and_update_project(), user_a() (+1 more)

### Community 53 - "create_application"
Cohesion: 0.09
Nodes (7): get_health(), get_readiness(), create_application(), root_health(), lifespan(), HealthResponse, client()

### Community 55 - "ExplorePage.tsx"
Cohesion: 0.14
Nodes (16): EmptyState(), EmptyStateProps, CATEGORIES, CategoryFilter(), CategoryFilterProps, FeedTabs(), FeedTabsProps, PublicProjectCard() (+8 more)

### Community 57 - "test_online_brain_and_discussions.py"
Cohesion: 0.12
Nodes (9): audit_and_moderate_content(), _signup_user(), test_moderation_shield_and_spam_detection(), test_multi_grounded_project_chat_with_brain(), test_project_changelog_lifecycle(), test_project_review_notifications(), test_recent_comments_discussion_feed_filtering(), test_similar_projects_ecosystem_cross_referencing() (+1 more)

### Community 58 - "NvidiaNimProvider"
Cohesion: 0.20
Nodes (3): NvidiaNimProvider, test_nvidia_nim_markdown_fence_cleaning(), test_nvidia_nim_provider_headers()

### Community 59 - "test_phase_6_feedback_report.py"
Cohesion: 0.13
Nodes (8): ensure_offline_ai(), other_user_headers(), owner_headers(), test_feedback_report_markdown_export(), test_feedback_report_multi_tenant_isolation(), test_iteration_comparison_and_resolution_tracking(), test_list_and_get_specific_feedback_reports(), test_report_error_and_empty_states()

### Community 60 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, lucide-react@^1.63.0, @radix-ui/react-dialog@^1.3.1, @radix-ui/react-dropdown-menu@^2.2.1, @radix-ui/react-popover@^1.3.1, @radix-ui/react-tabs@^1.2.1, @radix-ui/react-tooltip@^1.4.1, react@^19.3.1 (+9 more)

### Community 61 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 63 - "test_phase_9_creator_space.py"
Cohesion: 0.17
Nodes (7): create_user_and_headers(), ensure_offline_ai(), test_creator_ownership_isolation_and_permission_checks(), test_creator_profile_editing_and_persistence(), test_creator_publishing_and_revocation_lifecycle(), test_creator_studio_requires_auth_and_computes_metrics(), test_public_creator_profile_data_projection()

### Community 64 - "frontend/package.json"
Cohesion: 0.17
Nodes (15): devDependencies, oxlint@^1.89.0, @types/node@^24.19.2, @types/react@^19.3.0, @types/react-dom@^19.3.0, typescript@~7.0.2, name, private (+7 more)

### Community 65 - "test_phase_14_closure_verification.py"
Cohesion: 0.14
Nodes (8): client(), _create_user(), test_ai_budgets_api_lifecycle(), test_cross_tenant_isolation_on_budgets_and_snapshots(), test_finding_evidence_citations_lifecycle(), test_health_liveness_and_readiness_probes(), test_immutable_project_snapshot_retrieval(), test_public_space_read_only_invariance()

### Community 66 - "package.json"
Cohesion: 0.13
Nodes (14): author, description, keywords, license, name, private, scripts, build (+6 more)

### Community 67 - "budgets.py"
Cohesion: 0.18
Nodes (6): BudgetResponse, BudgetUpdateRequest, get_account_budget(), get_user_id(), list_user_budgets(), update_budget()

### Community 68 - "GeminiAnalysisOutput"
Cohesion: 0.19
Nodes (4): GeminiAnalysisOutput, StructuredProductReviewProposal, HybridAIProvider, LLMProvider

### Community 69 - "log_structured_signal"
Cohesion: 0.11
Nodes (4): log_structured_signal(), ReviewWorker, heartbeat_worker(), test_atomic_review_finalization_success()

### Community 70 - "test_phase_7_e2e_journey.py"
Cohesion: 0.21
Nodes (5): create_test_user(), ensure_offline_ai(), test_complete_end_to_end_personal_journey(), test_reliability_and_idempotent_recovery(), test_security_adversarial_and_isolation_attacks()

### Community 71 - "test_phase_4_chat_and_rag.py"
Cohesion: 0.10
Nodes (6): calculate_prioritization_score(), PrioritizationScoreBreakdown, ProductSuggestionService, test_deterministic_scoring_formula(), test_severity_keyword_detection(), TestFinalAIEvaluationAndGrounding

### Community 73 - "test_apk_and_community_voices.py"
Cohesion: 0.20
Nodes (5): auth_headers(), client(), test_apk_release_lifecycle(), test_public_projects_sort_options(), test_recent_comments_endpoint()

### Community 75 - "database.types.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 76 - "create_mock_user"
Cohesion: 0.19
Nodes (6): create_auth_headers(), create_mock_user(), test_chat_session_lifecycle_and_ownership_isolation(), test_citation_hallucination_pruning_in_chat(), test_prompt_injection_in_comments_defended(), test_suggestions_endpoint()

### Community 79 - "repository.py"
Cohesion: 0.15
Nodes (4): app_client(), author_token(), other_user_token(), seeded_context()

### Community 80 - "ProjectApkReleaseRead"
Cohesion: 0.14
Nodes (7): list_project_apk_releases(), update_finding_status(), update_project(), update_project_apk_release_status(), update_task_status(), ProjectApkReleaseRead, TaskStatusUpdateRequest

### Community 84 - "test_phase_5_ai_review_engine.py"
Cohesion: 0.13
Nodes (8): ensure_offline_ai(), other_user_headers(), owner_headers(), test_ai_review_context_validation_boundary(), test_ai_review_lifecycle_and_structured_report(), test_ai_review_ownership_isolation(), test_finding_status_lifecycle_progression(), test_list_historical_reviews()

### Community 85 - "vite.config.ts"
Cohesion: 0.25
Nodes (6): @tailwindcss/vite@^4.3.3, vite@^8.3.5, @vitejs/plugin-react@^6.1.2, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 86 - "ProductDetailPage.tsx"
Cohesion: 0.11
Nodes (25): Badge(), BadgeProps, CardSkeleton(), FeedSkeleton(), FormSkeleton(), PageSkeleton(), Skeleton(), SkeletonProps (+17 more)

### Community 89 - "test_phase_3_saas_auth_and_multitenancy.py"
Cohesion: 0.15
Nodes (5): Settings, _register_user(), test_multi_tenant_project_sources_and_documents_isolation(), test_multi_tenant_research_conversations_isolation(), test_password_recovery_full_lifecycle()

### Community 90 - "decode_access_token"
Cohesion: 0.17
Nodes (7): decode_access_token(), get_authenticated_principal(), get_current_user_optional(), get_user_mfa_status(), verify_local_token(), verify_supabase_token(), test_expired_session_token_rejection()

### Community 91 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 92 - "Any"
Cohesion: 0.16
Nodes (6): check_mfa_status(), get_auth_config(), get_current_principal(), get_me(), list_linked_identities(), unlink_identity()

### Community 93 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 97 - "services"
Cohesion: 0.14
Nodes (13): key, sync, value, services, buildCommand, env, envVars, healthCheckPath (+5 more)

### Community 99 - "post"
Cohesion: 0.15
Nodes (6): confirm_reset(), enroll_mfa(), logout(), request_reset(), verify_mfa(), confirm_password_reset()

### Community 124 - "StructuredProjectFeedbackProposal"
Cohesion: 0.24
Nodes (4): RawProjectFindingProposal, StructuredProjectFeedbackProposal, test_ai_orchestrator_sanitizes_proposals(), test_ai_review_engine_picks_up_vault_byok_credential()

### Community 126 - "get_active_auth_provider"
Cohesion: 0.33
Nodes (3): login(), get_active_auth_provider(), test_production_environment_safety_locks()

## Knowledge Gaps
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CommunityRepository` connect `CommunityRepository` to `.update_research_report`, `.get_comment`, `._serialize_product_review`, `._serialize_post`, `repository.py`, `.create_user`, `utc_now_iso`, `Any`, `.create_chat_session`, `.save_analysis_run`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.039167182024324884 - nodes in this community are weakly interconnected._
- **Why does `clean_evidence_quote()` connect `clean_evidence_quote` to `ProjectChatAndWorkflowService`, `.retrieve_evidence`, `AIOrchestratorService`, `uuid`, `AdvancedRAGEngine`, `CompletenessMapService`, `ComprehensiveIntelligenceService`, `WebIntelligenceService`, `v1/ai.py`, `SourceIngestionService`, `StructuredProjectFeedbackProposal`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.09663120567375887 - nodes in this community are weakly interconnected._
- **Why does `ProjectRepository` connect `ProjectRepository` to `os`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.09562841530054644 - nodes in this community are weakly interconnected._
- **Should `test_auth_and_community.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._