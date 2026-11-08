# Graph Report - ai web application  (2026-11-08)

## Corpus Check
- 229 files · ~372,597 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 18 file(s) not represented in the graph (top: (none) 10, .css 2, .jsonc 2)

## Summary
- 2834 nodes · 6692 edges · 141 communities (73 shown, 68 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 223 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e7a8c54`
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
- v1/ai.py
- SourceIngestionService
- test_full_product_review.py
- utc_now_iso
- CommunityRepository
- comments.py
- v1/credentials.py
- v1/creator.py
- auth_service.py
- react
- DatabaseManager
- typing
- post
- ProjectChatAndWorkflowService
- steps
- GeminiProvider
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
- test_online_brain_and_discussions.py
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
- Any
- test_independent_projects_can_run_reviews_concurrently
- test_idempotent_finalization_does_not_duplicate_counters_or_reports
- TestReportManagementAndAccessBoundaries
- test_phase_5_ai_review_engine.py
- vite.config.ts
- ProductDetailPage.tsx
- ProviderPolicyService
- delete_project_source
- test_health.py
- test_transaction_rollback_leaves_no_partial_findings
- .oxlintrc.json
- scripts
- services
- tsconfig.json
- clsx
- @supabase/supabase-js
- tailwind-merge
- tailwindcss@^4.3.3
- three
- TestPDFExportEngine
- repository.py
- router.py
- test_stale_job_terminal_failure_exhausts_retries_and_resets_project
- v1/auth.py
- ProjectApkReleaseRead
- StructuredProjectFeedbackProposal
- check_mfa_status
- test_phase_3_saas_auth_and_multitenancy.py
- ComprehensiveIntelligenceService
- verify_mfa
- AuthenticatedPrincipal
- request_reset

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
- `get_research_report()` --uses--> `ResearchReportResponse`  [INFERRED]
  backend/app/api/v1/ai.py → backend/app/schemas/research_report.py
- `list_user_reports_for_post()` --uses--> `ResearchReportResponse`  [INFERRED]
  backend/app/api/v1/ai.py → backend/app/schemas/research_report.py
- `ReportGenerationService` --uses--> `ResearchReportType`  [INFERRED]
  backend/app/services/report_generation_service.py → backend/app/schemas/research_report.py
- `ReviewService` --uses--> `ReportPDFRenderer`  [INFERRED]
  backend/app/services/review_service.py → backend/app/services/report_generation_service.py

## Import Cycles
- None detected.

## Communities (141 total, 68 thin omitted)

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
Cohesion: 0.17
Nodes (9): login(), oauth_callback(), signup(), AuthTokenResponse, OAuthCallbackPayload, PublicUserProfileResponse, UserLoginRequest, UserProfileResponse (+1 more)

### Community 6 - "useAuth"
Cohesion: 0.09
Nodes (41): CommentComposer(), CommentComposerProps, CommentThread(), CommentThreadProps, AgentMode, AIInsightsView(), AIInsightsViewProps, MobileWorkspaceTab (+33 more)

### Community 7 - ".retrieve_evidence"
Cohesion: 0.12
Nodes (7): DiscussionRetrievalService, extract_keywords(), RetrievalResult, RetrievedComment, RetrievedThemeMatch, tokenize_text(), test_conversational_pronoun_expansion()

### Community 9 - "schemas/ai.py"
Cohesion: 0.06
Nodes (20): AIAnalysisResponse, GeminiAnalysisOutput, RawRecommendationProposal, RawThemeProposal, AnalysisService, compute_discussion_input_hash(), InsufficientFeedbackError, auth_users() (+12 more)

### Community 11 - "posts.py"
Cohesion: 0.07
Nodes (21): bookmark_post(), create_post(), delete_post(), delete_post_document(), get_post(), get_post_document(), get_saved_posts(), list_post_documents() (+13 more)

### Community 12 - "Any"
Cohesion: 0.09
Nodes (13): delete_chat_session(), delete_research_report(), download_product_review(), download_research_report(), get_chat_session(), get_post_insights(), get_product_review(), get_research_report() (+5 more)

### Community 13 - "report.py"
Cohesion: 0.11
Nodes (8): list_reports(), resolve_report(), submit_report(), toggle_post_lock(), PostLockRequest, ReportCreateRequest, ReportResolveRequest, ReportResponse

### Community 14 - "ReportGenerationService"
Cohesion: 0.11
Nodes (4): ReportGenerationService, ReportPDFRenderer, _sanitize_for_pdf(), _flush_table()

### Community 15 - "pytest"
Cohesion: 0.09
Nodes (16): BudgetExceededError, validate_external_url(), main(), test_ssrf_protection_rejects_forbidden_and_private_hosts(), client(), _create_authenticated_user(), test_area_1_account_project_and_task_ai_budget_enforcement(), test_area_2_complete_finding_evidence_traceability() (+8 more)

### Community 16 - "OpenRouterProvider"
Cohesion: 0.07
Nodes (7): Settings, OpenRouterFreeTierViolationError, OpenRouterProvider, clean_input_text(), test_openrouter_429_automatic_fallback(), test_openrouter_free_tier_enforcement(), test_openrouter_headers()

### Community 18 - "os"
Cohesion: 0.07
Nodes (23): enroll_user_mfa(), test_area_10_backup_restoration_integrity(), capture_page(), main(), main(), run_capture(), capture_studio_experience(), main() (+15 more)

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
Cohesion: 0.04
Nodes (29): create_chat_session(), get_product_suggestions(), ChatMessageRequest, ChatMessageResponse, ChatSessionCreateRequest, ChatSessionResponse, ChatSessionUpdateRequest, CitationRecord (+21 more)

### Community 25 - "test_full_product_review.py"
Cohesion: 0.08
Nodes (12): client(), setup_product_data(), test_criterion_11_unauthorized_users_cannot_access_reviews(), test_criterion_12_review_reports_can_be_reopened_and_exported(), test_criterion_1_opening_ai_lab_does_not_make_ai_request(), test_criterion_2_full_review_runs_only_after_explicit_owner_action(), test_criterion_3_all_eligible_product_sources_considered(), test_criterion_4_excluded_sources_are_not_retrieved() (+4 more)

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
Nodes (20): compute_totp_code(), create_mock_supabase_token(), decode_access_token(), get_current_user_optional(), get_current_user_required(), handle_oauth_callback(), request_password_reset(), verify_local_token() (+12 more)

### Community 33 - "react"
Cohesion: 0.17
Nodes (21): AboutSection(), CommunityVoices(), DomainConfig, DOMAINS, ExploreByDomain(), ExploreByDomainProps, Hero3D(), HomeFooter() (+13 more)

### Community 34 - "DatabaseManager"
Cohesion: 0.14
Nodes (4): DatabaseManager, get_db_path(), CreatorRepository, utc_now_iso()

### Community 35 - "typing"
Cohesion: 0.10
Nodes (4): clean_evidence_quote(), clean_list_items(), clean_output_text(), test_clean_evidence_quote_strips_all_symbols()

### Community 36 - "post"
Cohesion: 0.08
Nodes (15): create_project(), link_project_design(), link_project_repository(), record_author_decision(), run_comprehensive_project_audit(), take_finding_action(), upload_project_apk_release(), upload_project_source_file() (+7 more)

### Community 38 - "steps"
Cohesion: 0.09
Nodes (24): name, runs-on, steps, name, runs-on, steps, jobs, backend-test (+16 more)

### Community 39 - "GeminiProvider"
Cohesion: 0.08
Nodes (5): GeminiProvider, get_ai_provider(), LLMProvider, test_gemini_provider_missing_key_behavior(), test_missing_api_key_returns_503()

### Community 40 - "create_access_token"
Cohesion: 0.05
Nodes (19): create_access_token(), auth_headers(), client(), test_apk_release_lifecycle(), test_public_projects_sort_options(), test_recent_comments_endpoint(), test_moderation_report_submission_and_resolution(), test_notifications_lifecycle() (+11 more)

### Community 41 - "uuid"
Cohesion: 0.05
Nodes (22): test_ai_orchestrator_byok_vault_integration(), test_ai_orchestrator_deterministic_fallback(), test_ai_orchestrator_token_usage_ledger_recording(), test_compare_feedback_reports_includes_omitted_findings(), test_retrieval_service_produces_clean_evidence(), test_source_ingestion_preserves_canonical_verbatim_raw_text(), test_budget_reservation_and_hard_stop(), test_decoupled_task_completion_and_insufficient_evidence() (+14 more)

### Community 42 - "notifications.py"
Cohesion: 0.14
Nodes (5): get_notifications(), get_unread_count(), mark_all_read(), mark_read(), NotificationResponse

### Community 45 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 46 - "GeminiConfigurationError"
Cohesion: 0.05
Nodes (19): generate_full_product_review(), send_chat_message(), send_review_conversation_message(), trigger_post_analysis(), ResearchAnswerProposal, RawReviewFinding, StructuredProductReviewProposal, GeminiConfigurationError (+11 more)

### Community 47 - "test_phase_8_public_space.py"
Cohesion: 0.12
Nodes (10): community_headers(), create_user(), creator_headers(), ensure_offline_ai(), test_community_upvoting_and_rate_enforcement(), test_direct_public_project_access_and_private_isolation(), test_explicit_publishing_and_revocation_lifecycle(), test_public_feedback_report_access() (+2 more)

### Community 48 - "v1/dev.py"
Cohesion: 0.05
Nodes (36): get_dev_health(), get_dev_quick_token(), manage_synthetic_data(), run_ai_test(), run_evaluation_benchmark(), verify_dev_mode(), AITestCaseRequest, AITestCaseResult (+28 more)

### Community 50 - "test_phase_2_reliability_and_concurrency.py"
Cohesion: 0.14
Nodes (8): ensure_offline_ai(), other_user_auth(), owner_auth(), sample_project(), test_orphan_in_review_project_recovery(), test_single_active_review_rule_and_database_constraint(), test_stale_job_recovery_and_backoff_retry(), test_unauthorized_user_cannot_start_or_inspect_review()

### Community 51 - "test_phase_4_personal_projects.py"
Cohesion: 0.11
Nodes (9): test_create_project_full_intake_workflow(), test_cross_user_isolation(), test_delete_project_and_cascade(), test_field_validation_boundaries(), test_lifecycle_status_progression(), test_personal_projects_filtering(), test_reopen_and_update_project(), user_a() (+1 more)

### Community 52 - "report_generation_service.py"
Cohesion: 0.09
Nodes (8): generate_research_report(), rename_chat_session(), update_research_report(), UnreadCountResponse, ReportGenerateRequest, ReportUpdateRequest, ResearchReportResponse, ResearchReportType

### Community 53 - "create_application"
Cohesion: 0.08
Nodes (10): get_health(), get_readiness(), create_application(), root_health(), lifespan(), HealthResponse, confirm_password_reset(), hash_password() (+2 more)

### Community 54 - "projects.py"
Cohesion: 0.10
Nodes (16): compare_feedback_reports(), create_project_changelog(), export_feedback_report(), get_project_changelog(), get_public_feedback_report(), get_public_project(), list_public_projects(), set_project_ai_config() (+8 more)

### Community 55 - "test_phase_6_feedback_report.py"
Cohesion: 0.13
Nodes (8): ensure_offline_ai(), other_user_headers(), owner_headers(), test_feedback_report_markdown_export(), test_feedback_report_multi_tenant_isolation(), test_iteration_comparison_and_resolution_tracking(), test_list_and_get_specific_feedback_reports(), test_report_error_and_empty_states()

### Community 56 - "ReviewWorker"
Cohesion: 0.15
Nodes (3): ReviewWorker, test_atomic_review_finalization_success(), test_worker_claiming_and_lease_renewal()

### Community 57 - "test_online_brain_and_discussions.py"
Cohesion: 0.12
Nodes (9): audit_and_moderate_content(), _signup_user(), test_moderation_shield_and_spam_detection(), test_multi_grounded_project_chat_with_brain(), test_project_changelog_lifecycle(), test_project_review_notifications(), test_recent_comments_discussion_feed_filtering(), test_similar_projects_ecosystem_cross_referencing() (+1 more)

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
Cohesion: 0.06
Nodes (19): calculate_prioritization_score(), PrioritizationScoreBreakdown, ProductSuggestionService, client(), create_auth_headers(), create_mock_user(), setup_test_database(), test_bm25_keyword_retrieval_ranking() (+11 more)

### Community 79 - "Any"
Cohesion: 0.14
Nodes (7): enroll_mfa(), get_auth_config(), get_me(), list_linked_identities(), logout(), unlink_identity(), MFAEnrollResponse

### Community 84 - "test_phase_5_ai_review_engine.py"
Cohesion: 0.13
Nodes (8): ensure_offline_ai(), other_user_headers(), owner_headers(), test_ai_review_context_validation_boundary(), test_ai_review_lifecycle_and_structured_report(), test_ai_review_ownership_isolation(), test_finding_status_lifecycle_progression(), test_list_historical_reviews()

### Community 85 - "vite.config.ts"
Cohesion: 0.25
Nodes (6): @tailwindcss/vite@^4.3.3, vite@^8.3.5, @vitejs/plugin-react@^6.1.2, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 86 - "ProductDetailPage.tsx"
Cohesion: 0.07
Nodes (41): Badge(), BadgeProps, EmptyState(), EmptyStateProps, CardSkeleton(), FeedSkeleton(), FormSkeleton(), PageSkeleton() (+33 more)

### Community 89 - "test_health.py"
Cohesion: 0.17
Nodes (5): test_api_v1_health_endpoint(), test_cors_headers_configured(), test_nonexistent_route_returns_404(), test_post_insights_returns_expected_phase1_status(), test_root_health_endpoint()

### Community 91 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 93 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 97 - "services"
Cohesion: 0.14
Nodes (13): key, sync, value, services, buildCommand, env, envVars, healthCheckPath (+5 more)

### Community 124 - "repository.py"
Cohesion: 0.09
Nodes (10): ensure_db(), test_authenticated_principal_endpoint(), test_mfa_enrollment_and_verification_endpoints(), test_oauth_linking_and_collision_protection(), test_password_reset_lifecycle(), test_vault_aad_tamper_and_tenant_isolation(), test_vault_crud_and_isolation(), test_vault_encryption_decryption_with_aad() (+2 more)

### Community 130 - "v1/auth.py"
Cohesion: 0.18
Nodes (6): confirm_email_endpoint(), confirm_reset(), _confirm_supabase_user_by_email(), EmailConfirmPayload, get_current_principal(), PasswordResetConfirmPayload

### Community 131 - "ProjectApkReleaseRead"
Cohesion: 0.14
Nodes (7): list_project_apk_releases(), update_finding_status(), update_project(), update_project_apk_release_status(), update_task_status(), ProjectApkReleaseRead, TaskStatusUpdateRequest

### Community 132 - "StructuredProjectFeedbackProposal"
Cohesion: 0.24
Nodes (4): RawProjectFindingProposal, StructuredProjectFeedbackProposal, test_ai_orchestrator_sanitizes_proposals(), test_ai_review_engine_picks_up_vault_byok_credential()

### Community 133 - "check_mfa_status"
Cohesion: 0.22
Nodes (5): check_mfa_status(), unenroll_mfa(), MFAStatusResponse, get_user_mfa_status(), unenroll_user_mfa()

### Community 134 - "test_phase_3_saas_auth_and_multitenancy.py"
Cohesion: 0.31
Nodes (4): _register_user(), test_multi_tenant_project_sources_and_documents_isolation(), test_multi_tenant_research_conversations_isolation(), test_password_recovery_full_lifecycle()

### Community 136 - "verify_mfa"
Cohesion: 0.40
Nodes (3): verify_mfa(), MFAVerifyPayload, verify_user_mfa()

## Knowledge Gaps
- **68 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CommunityRepository` connect `CommunityRepository` to `auth_service.py`, `.update_research_report`, `.get_comment`, `._serialize_product_review`, `._serialize_post`, `.create_user`, `utc_now_iso`, `Any`, `.create_chat_session`, `.save_analysis_run`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0393733250876108 - nodes in this community are weakly interconnected._
- **Why does `clean_evidence_quote()` connect `typing` to `StructuredProjectFeedbackProposal`, `ProjectChatAndWorkflowService`, `ComprehensiveIntelligenceService`, `AIOrchestratorService`, `.retrieve_evidence`, `AdvancedRAGEngine`, `CompletenessMapService`, `WebIntelligenceService`, `v1/ai.py`, `SourceIngestionService`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.0927536231884058 - nodes in this community are weakly interconnected._
- **Why does `ProjectRepository` connect `ProjectRepository` to `typing`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.09482001755926252 - nodes in this community are weakly interconnected._
- **Should `test_auth_and_community.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._