# Graph Report - ai web application  (2026-11-08)

## Corpus Check
- 229 files · ~372,649 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 18 file(s) not represented in the graph (top: (none) 10, .css 2, .jsonc 2)

## Summary
- 2834 nodes · 6684 edges · 146 communities (74 shown, 72 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 215 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `03affd11`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- types/index.ts
- lucide-react
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
- Any
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
- ReviewService
- SourceIngestionService
- MockGeminiProvider
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
- ResearchChatService
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
- report_generation_service.py
- create_application
- projects.py
- test_phase_6_feedback_report.py
- ReviewWorker
- get_current_user_required
- flatten_comments_tree
- StaleLeaseError
- dependencies
- compilerOptions
- TestResearchReportGeneration
- test_concurrent_simultaneous_review_requests
- frontend/package.json
- test_phase_14_closure_verification.py
- package.json
- budgets.py
- ProjectAIReviewEngine
- log_structured_signal
- test_phase_7_e2e_journey.py
- test_phase_9_creator_space.py
- NvidiaNimProvider
- test_phase_2_engineering_foundation.py
- database.types.ts
- test_phase_4_chat_and_rag.py
- TestClient
- test_independent_projects_can_run_reviews_concurrently
- test_idempotent_finalization_does_not_duplicate_counters_or_reports
- TestReportManagementAndAccessBoundaries
- test_phase_5_ai_review_engine.py
- vite.config.ts
- ProductDetailPage.tsx
- ProviderPolicyService
- delete_project_source
- main.py
- test_transaction_rollback_leaves_no_partial_findings
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
- test_stale_job_terminal_failure_exhausts_retries_and_resets_project
- v1/auth.py
- ProjectApkReleaseRead
- StructuredProjectFeedbackProposal
- check_mfa_status
- test_phases_4_to_10_complete_workflow.py
- ComprehensiveIntelligenceService
- create_backup
- delete_chat_session
- request_reset
- .generate_suggestions
- Settings
- OpenRouterFreeTierViolationError
- test_online_brain_and_discussions.py

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
- `lifespan()` --calls--> `seed_demo_data()`  [EXTRACTED]
  backend/app/main.py → scripts/seed_demo_community_data.py
- `test_area_10_backup_restoration_integrity()` --calls--> `verify_backup_and_recovery()`  [EXTRACTED]
  backend/tests/test_phase_13_production_readiness.py → scripts/verify_backup_and_recovery.py
- `upload_project_apk_release()` --uses--> `ProjectApkReleaseRead`  [INFERRED]
  backend/app/api/v1/projects.py → backend/app/schemas/project.py
- `ComprehensiveIntelligenceService` --uses--> `StructuredProjectFeedbackProposal`  [INFERRED]
  backend/app/services/comprehensive_intelligence_service.py → backend/app/schemas/project.py
- `NvidiaNimProvider` --uses--> `StructuredProjectFeedbackProposal`  [INFERRED]
  backend/app/services/nvidia_service.py → backend/app/schemas/project.py

## Import Cycles
- None detected.

## Communities (146 total, 72 thin omitted)

### Community 0 - "types/index.ts"
Cohesion: 0.04
Nodes (86): PRESET_QUERIES, ProjectChatTabProps, ProjectCompletenessTabProps, AVAILABLE_FOCUS_AREAS, ProjectReviewTabProps, ProjectSourcesTabProps, ProjectTasksTabProps, getHeaders() (+78 more)

### Community 1 - "lucide-react"
Cohesion: 0.09
Nodes (32): ProtectedRoute(), ProtectedRouteProps, AppLoadingScreen(), AppLoadingScreenProps, CommandItem, CommandPalette(), CommandPaletteProps, ThemeSwitcher() (+24 more)

### Community 2 - "Button"
Cohesion: 0.09
Nodes (45): App(), AuthModal(), Button, ButtonProps, Card(), CardProps, DeveloperWorkspace(), ProjectCompletenessTab() (+37 more)

### Community 3 - "test_auth_and_community.py"
Cohesion: 0.06
Nodes (14): registered_users(), test_anonymous_post_and_comment_privacy(), test_atomic_post_and_comment_voting(), test_auth_duplicate_email_rejected(), test_auth_invalid_credentials_rejected(), test_auth_me_with_valid_and_invalid_token(), test_bookmarks_persistence(), test_confirm_email_endpoint() (+6 more)

### Community 4 - "lucide-react"
Cohesion: 0.09
Nodes (39): AboutModal(), AboutModalProps, Drawer(), DrawerProps, Dropdown, DropdownCheckboxItem, DropdownContent, DropdownGroup (+31 more)

### Community 5 - "schemas/auth.py"
Cohesion: 0.13
Nodes (7): get_me(), oauth_callback(), signup(), AuthTokenResponse, OAuthCallbackPayload, UserProfileResponse, UserRegisterRequest

### Community 6 - "useAuth"
Cohesion: 0.09
Nodes (41): CommentComposer(), CommentComposerProps, CommentThread(), CommentThreadProps, AgentMode, AIInsightsView(), AIInsightsViewProps, MobileWorkspaceTab (+33 more)

### Community 7 - ".retrieve_evidence"
Cohesion: 0.12
Nodes (7): DiscussionRetrievalService, extract_keywords(), RetrievalResult, RetrievedComment, RetrievedThemeMatch, tokenize_text(), test_conversational_pronoun_expansion()

### Community 9 - "schemas/ai.py"
Cohesion: 0.05
Nodes (27): AIAnalysisResponse, ChatMessageRequest, ChatSessionCreateRequest, ChatSessionUpdateRequest, DisagreementFinding, GeminiAnalysisOutput, RawDisagreementProposal, RawRecommendationProposal (+19 more)

### Community 11 - "posts.py"
Cohesion: 0.07
Nodes (21): bookmark_post(), create_post(), delete_post(), delete_post_document(), get_post(), get_post_document(), get_saved_posts(), list_post_documents() (+13 more)

### Community 12 - "Any"
Cohesion: 0.11
Nodes (11): create_chat_session(), download_product_review(), download_research_report(), get_chat_session(), get_post_insights(), get_product_review(), get_product_suggestions(), get_review_conversation() (+3 more)

### Community 13 - "report.py"
Cohesion: 0.13
Nodes (8): list_reports(), resolve_report(), submit_report(), toggle_post_lock(), PostLockRequest, ReportCreateRequest, ReportResolveRequest, ReportResponse

### Community 14 - "ReportGenerationService"
Cohesion: 0.11
Nodes (4): ReportGenerationService, ReportPDFRenderer, _sanitize_for_pdf(), _flush_table()

### Community 15 - "pytest"
Cohesion: 0.11
Nodes (15): BudgetExceededError, main(), client(), _create_authenticated_user(), test_area_10_backup_restoration_integrity(), test_area_1_account_project_and_task_ai_budget_enforcement(), test_area_2_complete_finding_evidence_traceability(), test_area_3_multimodal_design_and_visual_ai_understanding() (+7 more)

### Community 16 - "OpenRouterProvider"
Cohesion: 0.11
Nodes (4): OpenRouterProvider, test_openrouter_429_automatic_fallback(), test_openrouter_free_tier_enforcement(), test_openrouter_headers()

### Community 18 - "os"
Cohesion: 0.10
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

### Community 23 - "ReviewService"
Cohesion: 0.09
Nodes (11): ChatMessageResponse, CitationRecord, DocumentSourceInfo, GenerateReviewRequest, ProductReviewResponse, RawReviewFinding, ReviewFinding, ReviewSourceAvailabilityResponse (+3 more)

### Community 25 - "MockGeminiProvider"
Cohesion: 0.08
Nodes (12): ResearchAnswerProposal, get_ai_provider(), HybridAIProvider, LLMProvider, MockGeminiProvider, test_author_generates_persisted_insights_and_public_access(), test_mock_gemini_provider_generates_valid_schema(), test_stale_analysis_detection_on_new_comment() (+4 more)

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
Cohesion: 0.09
Nodes (10): create_mock_supabase_token(), auth_users(), test_anonymous_comment_privacy(), test_anonymous_post_privacy_and_immutability(), test_atomic_vote_toggling_and_comment_counter_integrity(), test_input_validation_and_url_scheme_protection(), test_moderation_reports_privacy(), test_ownership_enforcement_on_posts_and_comments() (+2 more)

### Community 33 - "react"
Cohesion: 0.17
Nodes (21): AboutSection(), CommunityVoices(), DomainConfig, DOMAINS, ExploreByDomain(), ExploreByDomainProps, Hero3D(), HomeFooter() (+13 more)

### Community 34 - "DatabaseManager"
Cohesion: 0.14
Nodes (4): DatabaseManager, get_db_path(), CreatorRepository, utc_now_iso()

### Community 35 - "typing"
Cohesion: 0.06
Nodes (13): ChatSessionResponse, ResearchAnswerResponse, RawProjectFindingProposal, retrieve_evidence(), clean_evidence_quote(), clean_input_text(), clean_list_items(), clean_output_text() (+5 more)

### Community 36 - "post"
Cohesion: 0.08
Nodes (15): create_project(), link_project_design(), link_project_repository(), record_author_decision(), run_comprehensive_project_audit(), take_finding_action(), upload_project_apk_release(), upload_project_source_file() (+7 more)

### Community 38 - "steps"
Cohesion: 0.09
Nodes (24): name, runs-on, steps, name, runs-on, steps, jobs, backend-test (+16 more)

### Community 40 - "create_access_token"
Cohesion: 0.09
Nodes (13): create_access_token(), auth_headers(), client(), test_apk_release_lifecycle(), test_public_projects_sort_options(), test_recent_comments_endpoint(), test_authenticated_principal_endpoint(), test_oauth_linking_and_collision_protection() (+5 more)

### Community 41 - "uuid"
Cohesion: 0.03
Nodes (35): test_ai_orchestrator_byok_vault_integration(), test_ai_orchestrator_deterministic_fallback(), test_ai_orchestrator_token_usage_ledger_recording(), test_compare_feedback_reports_includes_omitted_findings(), test_retrieval_service_produces_clean_evidence(), test_source_ingestion_preserves_canonical_verbatim_raw_text(), client(), setup_product_data() (+27 more)

### Community 42 - "notifications.py"
Cohesion: 0.12
Nodes (6): get_notifications(), get_unread_count(), mark_all_read(), mark_read(), NotificationResponse, UnreadCountResponse

### Community 45 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 46 - "GeminiConfigurationError"
Cohesion: 0.05
Nodes (15): generate_full_product_review(), send_chat_message(), send_review_conversation_message(), trigger_post_analysis(), CrossSourceComparison, StructuredRecommendation, StructuredProductReviewProposal, GeminiConfigurationError (+7 more)

### Community 47 - "test_phase_8_public_space.py"
Cohesion: 0.12
Nodes (10): community_headers(), create_user(), creator_headers(), ensure_offline_ai(), test_community_upvoting_and_rate_enforcement(), test_direct_public_project_access_and_private_isolation(), test_explicit_publishing_and_revocation_lifecycle(), test_public_feedback_report_access() (+2 more)

### Community 48 - "v1/dev.py"
Cohesion: 0.07
Nodes (29): get_dev_health(), get_dev_quick_token(), manage_synthetic_data(), run_ai_test(), run_evaluation_benchmark(), verify_dev_mode(), AITestCaseRequest, AITestCaseResult (+21 more)

### Community 50 - "test_phase_2_reliability_and_concurrency.py"
Cohesion: 0.14
Nodes (8): ensure_offline_ai(), other_user_auth(), owner_auth(), sample_project(), test_orphan_in_review_project_recovery(), test_single_active_review_rule_and_database_constraint(), test_stale_job_recovery_and_backoff_retry(), test_unauthorized_user_cannot_start_or_inspect_review()

### Community 51 - "test_phase_4_personal_projects.py"
Cohesion: 0.11
Nodes (9): test_create_project_full_intake_workflow(), test_cross_user_isolation(), test_delete_project_and_cascade(), test_field_validation_boundaries(), test_lifecycle_status_progression(), test_personal_projects_filtering(), test_reopen_and_update_project(), user_a() (+1 more)

### Community 52 - "report_generation_service.py"
Cohesion: 0.11
Nodes (10): generate_research_report(), get_research_report(), list_user_reports_for_post(), rename_chat_session(), update_research_report(), ProductSuggestionResponse, ReportGenerateRequest, ReportUpdateRequest (+2 more)

### Community 53 - "create_application"
Cohesion: 0.09
Nodes (9): get_health(), get_readiness(), create_application(), root_health(), HealthResponse, client(), app_client(), author_token() (+1 more)

### Community 54 - "projects.py"
Cohesion: 0.10
Nodes (16): compare_feedback_reports(), create_project_changelog(), export_feedback_report(), get_project_changelog(), get_public_feedback_report(), get_public_project(), list_public_projects(), set_project_ai_config() (+8 more)

### Community 55 - "test_phase_6_feedback_report.py"
Cohesion: 0.13
Nodes (8): ensure_offline_ai(), other_user_headers(), owner_headers(), test_feedback_report_markdown_export(), test_feedback_report_multi_tenant_isolation(), test_iteration_comparison_and_resolution_tracking(), test_list_and_get_specific_feedback_reports(), test_report_error_and_empty_states()

### Community 56 - "ReviewWorker"
Cohesion: 0.15
Nodes (3): ReviewWorker, test_atomic_review_finalization_success(), test_worker_claiming_and_lease_renewal()

### Community 57 - "get_current_user_required"
Cohesion: 0.17
Nodes (7): decode_access_token(), get_current_user_optional(), get_current_user_required(), handle_oauth_callback(), verify_local_token(), verify_supabase_token(), test_expired_session_token_rejection()

### Community 60 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, lucide-react@^1.63.0, @radix-ui/react-dialog@^1.3.1, @radix-ui/react-dropdown-menu@^2.2.1, @radix-ui/react-popover@^1.3.1, @radix-ui/react-tabs@^1.2.1, @radix-ui/react-tooltip@^1.4.1, react@^19.3.1 (+9 more)

### Community 61 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

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
Cohesion: 0.21
Nodes (6): BudgetResponse, BudgetUpdateRequest, get_account_budget(), get_user_id(), list_user_budgets(), update_budget()

### Community 70 - "test_phase_7_e2e_journey.py"
Cohesion: 0.21
Nodes (5): create_test_user(), ensure_offline_ai(), test_complete_end_to_end_personal_journey(), test_reliability_and_idempotent_recovery(), test_security_adversarial_and_isolation_attacks()

### Community 71 - "test_phase_9_creator_space.py"
Cohesion: 0.17
Nodes (7): create_user_and_headers(), ensure_offline_ai(), test_creator_ownership_isolation_and_permission_checks(), test_creator_profile_editing_and_persistence(), test_creator_publishing_and_revocation_lifecycle(), test_creator_studio_requires_auth_and_computes_metrics(), test_public_creator_profile_data_projection()

### Community 73 - "NvidiaNimProvider"
Cohesion: 0.20
Nodes (3): NvidiaNimProvider, test_nvidia_nim_markdown_fence_cleaning(), test_nvidia_nim_provider_headers()

### Community 75 - "database.types.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 76 - "test_phase_4_chat_and_rag.py"
Cohesion: 0.09
Nodes (12): calculate_prioritization_score(), PrioritizationScoreBreakdown, client(), setup_test_database(), test_bm25_keyword_retrieval_ranking(), test_chat_session_unauthenticated_returns_401(), test_cross_post_evidence_isolation(), test_deterministic_scoring_formula() (+4 more)

### Community 79 - "TestClient"
Cohesion: 0.13
Nodes (7): test_ai_testing_lab_complaints(), test_ai_testing_lab_empty_input_robustness(), test_ai_testing_lab_prompt_injection_robustness(), test_dev_endpoints_forbidden_in_production(), test_dev_health_telemetry(), test_dev_quick_auth_tokens(), test_evaluation_benchmark_suite()

### Community 84 - "test_phase_5_ai_review_engine.py"
Cohesion: 0.13
Nodes (8): ensure_offline_ai(), other_user_headers(), owner_headers(), test_ai_review_context_validation_boundary(), test_ai_review_lifecycle_and_structured_report(), test_ai_review_ownership_isolation(), test_finding_status_lifecycle_progression(), test_list_historical_reviews()

### Community 85 - "vite.config.ts"
Cohesion: 0.25
Nodes (6): @tailwindcss/vite@^4.3.3, vite@^8.3.5, @vitejs/plugin-react@^6.1.2, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 86 - "ProductDetailPage.tsx"
Cohesion: 0.07
Nodes (41): Badge(), BadgeProps, EmptyState(), EmptyStateProps, CardSkeleton(), FeedSkeleton(), FormSkeleton(), PageSkeleton() (+33 more)

### Community 89 - "main.py"
Cohesion: 0.06
Nodes (12): lifespan(), test_api_v1_health_endpoint(), test_cors_headers_configured(), test_nonexistent_route_returns_404(), test_post_insights_returns_expected_phase1_status(), test_root_health_endpoint(), test_moderation_report_submission_and_resolution(), test_notifications_lifecycle() (+4 more)

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
Cohesion: 0.08
Nodes (15): compute_totp_code(), enroll_user_mfa(), hash_password(), verify_password(), verify_totp_code(), ensure_db(), test_mfa_enrollment_and_verification_endpoints(), test_mfa_rfc6238_computation_and_drift() (+7 more)

### Community 125 - "schemas/auth.py"
Cohesion: 0.11
Nodes (9): confirm_reset(), enroll_mfa(), get_user_public_profile(), AuthenticatedPrincipal, MFAEnrollResponse, PasswordResetConfirmPayload, PublicUserProfileResponse, confirm_password_reset() (+1 more)

### Community 130 - "v1/auth.py"
Cohesion: 0.11
Nodes (10): confirm_email_endpoint(), _confirm_supabase_user_by_email(), EmailConfirmPayload, get_auth_config(), get_current_principal(), list_linked_identities(), login(), logout() (+2 more)

### Community 131 - "ProjectApkReleaseRead"
Cohesion: 0.14
Nodes (7): list_project_apk_releases(), update_finding_status(), update_project(), update_project_apk_release_status(), update_task_status(), ProjectApkReleaseRead, TaskStatusUpdateRequest

### Community 133 - "check_mfa_status"
Cohesion: 0.14
Nodes (8): check_mfa_status(), unenroll_mfa(), verify_mfa(), MFAStatusResponse, MFAVerifyPayload, get_user_mfa_status(), unenroll_user_mfa(), verify_user_mfa()

### Community 136 - "create_backup"
Cohesion: 0.43
Nodes (4): create_backup(), ensure_backup_dir(), list_backups(), verify_database_integrity()

### Community 138 - "request_reset"
Cohesion: 0.40
Nodes (3): request_reset(), PasswordResetRequestPayload, request_password_reset()

### Community 145 - "test_online_brain_and_discussions.py"
Cohesion: 0.12
Nodes (9): audit_and_moderate_content(), _signup_user(), test_moderation_shield_and_spam_detection(), test_multi_grounded_project_chat_with_brain(), test_project_changelog_lifecycle(), test_project_review_notifications(), test_recent_comments_discussion_feed_filtering(), test_similar_projects_ecosystem_cross_referencing() (+1 more)

## Knowledge Gaps
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CommunityRepository` connect `CommunityRepository` to `.update_research_report`, `typing`, `.get_comment`, `._serialize_product_review`, `._serialize_post`, `.create_user`, `utc_now_iso`, `Any`, `.create_chat_session`, `.save_analysis_run`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0393733250876108 - nodes in this community are weakly interconnected._
- **Why does `clean_evidence_quote()` connect `typing` to `StructuredProjectFeedbackProposal`, `ProjectChatAndWorkflowService`, `test_phases_4_to_10_complete_workflow.py`, `ComprehensiveIntelligenceService`, `AIOrchestratorService`, `.retrieve_evidence`, `AdvancedRAGEngine`, `CompletenessMapService`, `WebIntelligenceService`, `SourceIngestionService`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.0927536231884058 - nodes in this community are weakly interconnected._
- **Why does `ProjectRepository` connect `ProjectRepository` to `typing`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.09482001755926252 - nodes in this community are weakly interconnected._
- **Should `test_auth_and_community.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._