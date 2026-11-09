# Graph Report - ai web application  (2026-11-09)

## Corpus Check
- 234 files · ~443,593 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: (none) 12, .css 3, .jsonc 2)

## Summary
- 4685 nodes · 11536 edges · 208 communities (142 shown, 66 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 874 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `909233e1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- types/index.ts
- AuthContext.tsx
- Button
- test_auth_and_community.py
- lucide-react
- index-Cwmh5e-w.js
- useAuth
- .retrieve_evidence
- AIOrchestratorService
- schemas/ai.py
- ProjectRepository
- posts.py
- ai_orchestrator.py
- report.py
- ReportGenerationService
- pytest
- OpenRouterProvider
- WebIntelligenceService
- os
- CredentialVaultService
- projects.py
- get_user_id
- steps
- review_service.py
- SourceIngestionService
- _returnResult
- utc_now_iso
- CommunityRepository
- comments.py
- v1/credentials.py
- v1/creator.py
- auth_service.py
- react
- DatabaseManager
- typing
- upload_project_apk_release
- ProjectChatAndWorkflowService
- steps
- chat_service.py
- KeepAliveDaemon
- log
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
- main.py
- s
- uuid
- PublicProjectDetailPage.tsx
- ping
- flatten_comments_tree
- Wp
- dependencies
- compilerOptions
- TestResearchReportGeneration
- ReviewWorker
- frontend/package.json
- test_phase_14_closure_verification.py
- package.json
- budgets.py
- ProjectAIReviewEngine
- log_structured_signal
- test_phase_7_e2e_journey.py
- test_phase_2_1_reconciliation.py
- NvidiaNimProvider
- test_phase_2_engineering_foundation.py
- database.types.ts
- create_mock_user
- r
- StaleLeaseError
- at
- TestReportManagementAndAccessBoundaries
- t
- vite.config.ts
- ProductDetailPage.tsx
- ProviderPolicyService
- DocumentPreviewModal.tsx
- constructor
- test_concurrent_simultaneous_review_requests
- .oxlintrc.json
- scripts
- services
- test_independent_projects_can_run_reviews_concurrently
- tsconfig.json
- clsx
- @supabase/supabase-js
- tailwind-merge
- tailwindcss@^4.3.3
- three
- TestPDFExportEngine
- test_idempotent_finalization_does_not_duplicate_counters_or_reports
- v1/auth.py
- test_transaction_rollback_leaves_no_partial_findings
- po
- test_stale_job_terminal_failure_exhausts_retries_and_resets_project
- applyMatrix4
- _onChangeCallback
- create_access_token
- Ou
- b
- l
- oy
- calculate_prioritization_score
- OpenRouterFreeTierViolationError
- n
- add
- send
- up
- project.py
- gp
- GeminiAnalysisOutput
- clear
- GeminiProvider
- aD
- zf
- nm
- P
- _binaryDecode
- wv
- ka
- toJSON
- We
- qd
- retrieve_evidence
- ef
- NA
- setStyle
- dp
- tm
- retrieval_service.py
- test_phase_4_chat_and_rag.py
- _fromTexture
- distanceToPoint
- comprehensive_intelligence_service.py
- cm
- getValueSize
- Pg
- updateProjectionMatrix
- evaluate
- bind
- _denormalize
- subscribe
- Yj
- ah
- download
- ta
- parseJSON
- Kh
- wu
- ag
- _computeIntersections
- eD
- getDelta
- translateOnAxis
- ax
- _compileMaterial
- copyLinearToSRGB
- createTableIfNotExists
- determinantAffine
- detectEnvironment
- _getShaderStage
- getObjectByProperty
- rejoin
- mh
- serialize
- fromJSON
- throwOnError

## God Nodes (most connected - your core abstractions)
1. `n()` - 152 edges
2. `t()` - 146 edges
3. `constructor()` - 110 edges
4. `r()` - 94 edges
5. `Button` - 92 edges
6. `react` - 91 edges
7. `lucide-react` - 80 edges
8. `CommunityRepository` - 76 edges
9. `useAuth()` - 61 edges
10. `_returnResult()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `test_area_10_backup_restoration_integrity()` --calls--> `verify_backup_and_recovery()`  [EXTRACTED]
  backend/tests/test_phase_13_production_readiness.py → scripts/verify_backup_and_recovery.py
- `lifespan()` --calls--> `seed_demo_data()`  [EXTRACTED]
  backend/app/main.py → scripts/seed_demo_community_data.py
- `ReportGenerationService` --uses--> `ResearchReportType`  [INFERRED]
  backend/app/services/report_generation_service.py → backend/app/schemas/research_report.py
- `ReviewService` --uses--> `ReportPDFRenderer`  [INFERRED]
  backend/app/services/review_service.py → backend/app/services/report_generation_service.py
- `OpenRouterProvider` --uses--> `GeminiAnalysisOutput`  [INFERRED]
  backend/app/services/openrouter_service.py → backend/app/schemas/ai.py

## Import Cycles
- None detected.

## Communities (208 total, 66 thin omitted)

### Community 0 - "types/index.ts"
Cohesion: 0.04
Nodes (92): PRESET_QUERIES, ProjectChatTabProps, ProjectCompletenessTab(), ProjectCompletenessTabProps, AVAILABLE_FOCUS_AREAS, ProjectReviewTab(), ProjectReviewTabProps, ProjectSourcesTab() (+84 more)

### Community 1 - "AuthContext.tsx"
Cohesion: 0.12
Nodes (14): CommandItem, CommandPaletteProps, AuthContext, AuthContextType, mockComments, mockCurrentUser, mockPosts, CATEGORIES (+6 more)

### Community 2 - "Button"
Cohesion: 0.10
Nodes (44): App(), AuthModal(), AuthWarningCard(), AuthWarningCardProps, ProtectedRoute(), ProtectedRouteProps, AboutModalProps, AppLoadingScreen() (+36 more)

### Community 3 - "test_auth_and_community.py"
Cohesion: 0.06
Nodes (14): registered_users(), test_anonymous_post_and_comment_privacy(), test_atomic_post_and_comment_voting(), test_auth_duplicate_email_rejected(), test_auth_invalid_credentials_rejected(), test_auth_me_with_valid_and_invalid_token(), test_bookmarks_persistence(), test_confirm_email_endpoint() (+6 more)

### Community 4 - "lucide-react"
Cohesion: 0.07
Nodes (51): AboutModal(), CommandPalette(), Drawer(), DrawerProps, Dropdown, DropdownCheckboxItem, DropdownContent, DropdownGroup (+43 more)

### Community 5 - "index-Cwmh5e-w.js"
Cohesion: 0.00
Nodes (86): Ab(), addCredential(), addEventListener(), analytics(), Bd(), Br(), build(), componentDidCatch() (+78 more)

### Community 6 - "useAuth"
Cohesion: 0.08
Nodes (49): Badge(), BadgeProps, CommentComposer(), CommentComposerProps, CommentThread(), CommentThreadProps, AgentMode, AIInsightsView() (+41 more)

### Community 7 - ".retrieve_evidence"
Cohesion: 0.17
Nodes (4): DiscussionRetrievalService, extract_keywords(), tokenize_text(), test_conversational_pronoun_expansion()

### Community 8 - "AIOrchestratorService"
Cohesion: 0.10
Nodes (5): RawProjectFindingProposal, StructuredProjectFeedbackProposal, AIOrchestratorService, test_ai_orchestrator_sanitizes_proposals(), test_ai_review_engine_picks_up_vault_byok_credential()

### Community 9 - "schemas/ai.py"
Cohesion: 0.07
Nodes (17): AIAnalysisResponse, RawThemeProposal, AnalysisService, compute_discussion_input_hash(), flatten_comments_tree(), _traverse(), InsufficientFeedbackError, auth_users() (+9 more)

### Community 11 - "posts.py"
Cohesion: 0.07
Nodes (21): bookmark_post(), create_post(), delete_post(), delete_post_document(), get_post(), get_post_document(), get_saved_posts(), list_post_documents() (+13 more)

### Community 12 - "ai_orchestrator.py"
Cohesion: 0.10
Nodes (7): clean_list_items(), clean_output_text(), test_ai_orchestrator_byok_vault_integration(), test_ai_orchestrator_deterministic_fallback(), test_ai_orchestrator_token_usage_ledger_recording(), test_clean_evidence_quote_strips_all_symbols(), test_source_ingestion_preserves_canonical_verbatim_raw_text()

### Community 13 - "report.py"
Cohesion: 0.13
Nodes (8): list_reports(), resolve_report(), submit_report(), toggle_post_lock(), PostLockRequest, ReportCreateRequest, ReportResolveRequest, ReportResponse

### Community 14 - "ReportGenerationService"
Cohesion: 0.11
Nodes (4): ReportGenerationService, ReportPDFRenderer, _sanitize_for_pdf(), _flush_table()

### Community 15 - "pytest"
Cohesion: 0.06
Nodes (22): BudgetExceededError, validate_external_url(), main(), test_budget_reservation_and_hard_stop(), test_decoupled_task_completion_and_insufficient_evidence(), test_immutable_review_snapshot_full_content_and_hashes(), test_project(), test_ssrf_protection_rejects_forbidden_and_private_hosts() (+14 more)

### Community 16 - "OpenRouterProvider"
Cohesion: 0.11
Nodes (4): OpenRouterProvider, test_openrouter_429_automatic_fallback(), test_openrouter_free_tier_enforcement(), test_openrouter_headers()

### Community 18 - "os"
Cohesion: 0.07
Nodes (22): test_area_10_backup_restoration_integrity(), capture_page(), main(), main(), run_capture(), capture_studio_experience(), main(), run_captures() (+14 more)

### Community 19 - "CredentialVaultService"
Cohesion: 0.09
Nodes (3): CredentialVaultService, utc_now_iso(), VaultEncryptionError

### Community 20 - "projects.py"
Cohesion: 0.06
Nodes (28): create_project(), create_project_changelog(), create_project_chat(), export_feedback_report(), get_project_changelog(), link_project_design(), link_project_repository(), query_project_rag() (+20 more)

### Community 21 - "get_user_id"
Cohesion: 0.04
Nodes (30): get_current_principal(), delete_project(), download_project_apk_release(), get_ai_review_status(), get_finding_citations(), get_guided_discovery_questions(), get_latest_feedback_report(), get_product_completeness_map() (+22 more)

### Community 22 - "steps"
Cohesion: 0.05
Nodes (43): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+35 more)

### Community 23 - "review_service.py"
Cohesion: 0.06
Nodes (25): ChatMessageRequest, ChatSessionCreateRequest, ChatSessionResponse, ChatSessionUpdateRequest, CitationRecord, CrossSourceComparison, DisagreementFinding, ProductSuggestionResponse (+17 more)

### Community 25 - "_returnResult"
Cohesion: 0.06
Nodes (95): ac(), _acquireLock(), _approveAuthorization(), _authenticate(), _autoRefreshTokenTick(), _callRefreshToken(), _challenge(), _challengeAndVerify() (+87 more)

### Community 29 - "comments.py"
Cohesion: 0.10
Nodes (15): create_comment(), delete_comment(), get_post_comments(), get_recent_public_comments(), update_comment(), vote_comment(), delete_project_changelog(), delete_project_source() (+7 more)

### Community 30 - "v1/credentials.py"
Cohesion: 0.15
Nodes (13): add_credential(), delete_credential(), _extract_user_id(), get_credential(), list_credentials(), rotate_credential(), test_credential(), update_credential() (+5 more)

### Community 31 - "v1/creator.py"
Cohesion: 0.13
Nodes (13): get_creator_studio(), get_public_creator_profile(), get_user_id(), publish_project(), unpublish_project(), update_creator_profile(), CreatorProfileRead, CreatorProfileUpdate (+5 more)

### Community 32 - "auth_service.py"
Cohesion: 0.05
Nodes (27): compute_totp_code(), confirm_password_reset(), decode_access_token(), enroll_user_mfa(), get_authenticated_principal(), get_current_user_optional(), get_current_user_required(), handle_oauth_callback() (+19 more)

### Community 33 - "react"
Cohesion: 0.16
Nodes (20): AboutSection(), CommunityVoices(), DomainConfig, DOMAINS, ExploreByDomain(), ExploreByDomainProps, Hero3D(), HomeFooter() (+12 more)

### Community 34 - "DatabaseManager"
Cohesion: 0.14
Nodes (4): DatabaseManager, get_db_path(), CreatorRepository, utc_now_iso()

### Community 35 - "typing"
Cohesion: 0.05
Nodes (13): audit_and_moderate_content(), _signup_user(), test_moderation_shield_and_spam_detection(), test_multi_grounded_project_chat_with_brain(), test_project_changelog_lifecycle(), test_project_review_notifications(), test_recent_comments_discussion_feed_filtering(), test_similar_projects_ecosystem_cross_referencing() (+5 more)

### Community 36 - "upload_project_apk_release"
Cohesion: 0.18
Nodes (5): list_project_apk_releases(), upload_project_apk_release(), upload_project_source_file(), upload_project_visual(), ProjectApkReleaseRead

### Community 37 - "ProjectChatAndWorkflowService"
Cohesion: 0.10
Nodes (4): list_linked_identities(), logout(), unlink_identity(), ProjectChatAndWorkflowService

### Community 38 - "steps"
Cohesion: 0.09
Nodes (24): name, runs-on, steps, name, runs-on, steps, jobs, backend-test (+16 more)

### Community 39 - "chat_service.py"
Cohesion: 0.06
Nodes (6): ChatMessageResponse, ProductReviewResponse, ResearchChatService, get_ai_provider(), LLMProvider, ReviewService

### Community 40 - "KeepAliveDaemon"
Cohesion: 0.21
Nodes (3): KeepAliveDaemon, test_keep_alive_idempotent_start(), test_keep_alive_start_and_stop()

### Community 41 - "log"
Cohesion: 0.06
Nodes (60): Ar(), _cancelPendingDisconnect(), channel(), clearHeartbeats(), connect(), connectionState(), connectWithFallback(), disconnect() (+52 more)

### Community 42 - "notifications.py"
Cohesion: 0.14
Nodes (6): get_notifications(), get_unread_count(), mark_all_read(), mark_read(), NotificationResponse, UnreadCountResponse

### Community 44 - "AdvancedRAGEngine"
Cohesion: 0.14
Nodes (3): AdvancedRAGEngine, RetrievedKnowledgeEvidence, clean_evidence_quote()

### Community 45 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 46 - "GeminiConfigurationError"
Cohesion: 0.06
Nodes (12): generate_full_product_review(), send_chat_message(), send_review_conversation_message(), trigger_post_analysis(), ResearchAnswerProposal, StructuredProductReviewProposal, GeminiConfigurationError, GeminiRateLimitError (+4 more)

### Community 47 - "test_phase_8_public_space.py"
Cohesion: 0.12
Nodes (10): community_headers(), create_user(), creator_headers(), ensure_offline_ai(), test_community_upvoting_and_rate_enforcement(), test_direct_public_project_access_and_private_isolation(), test_explicit_publishing_and_revocation_lifecycle(), test_public_feedback_report_access() (+2 more)

### Community 48 - "v1/dev.py"
Cohesion: 0.08
Nodes (26): get_dev_health(), get_dev_quick_token(), manage_synthetic_data(), run_ai_test(), run_evaluation_benchmark(), verify_dev_mode(), AITestCaseRequest, AITestCaseResult (+18 more)

### Community 50 - "test_phase_2_reliability_and_concurrency.py"
Cohesion: 0.14
Nodes (8): ensure_offline_ai(), other_user_auth(), owner_auth(), sample_project(), test_orphan_in_review_project_recovery(), test_single_active_review_rule_and_database_constraint(), test_stale_job_recovery_and_backoff_retry(), test_unauthorized_user_cannot_start_or_inspect_review()

### Community 51 - "test_phase_4_personal_projects.py"
Cohesion: 0.11
Nodes (9): test_create_project_full_intake_workflow(), test_cross_user_isolation(), test_delete_project_and_cascade(), test_field_validation_boundaries(), test_lifecycle_status_progression(), test_personal_projects_filtering(), test_reopen_and_update_project(), user_a() (+1 more)

### Community 52 - "v1/ai.py"
Cohesion: 0.06
Nodes (22): create_chat_session(), delete_chat_session(), delete_research_report(), download_product_review(), download_research_report(), generate_research_report(), get_chat_session(), get_post_insights() (+14 more)

### Community 53 - "main.py"
Cohesion: 0.05
Nodes (19): get_health(), get_readiness(), create_application(), root_health(), lifespan(), HealthResponse, test_api_v1_health_endpoint(), test_cors_headers_configured() (+11 more)

### Community 54 - "s"
Cohesion: 0.06
Nodes (40): am(), u(), c(), cp(), g(), h(), m(), p() (+32 more)

### Community 55 - "uuid"
Cohesion: 0.04
Nodes (33): test_compare_feedback_reports_includes_omitted_findings(), test_cross_user_unauthorized_access_and_mutation(), test_identity_spoofing_immunity(), test_malformed_and_invalid_tokens(), test_space_isolation_and_leakage_prevention(), test_unauthenticated_protected_route_rejection(), user_a_headers(), user_b_headers() (+25 more)

### Community 56 - "PublicProjectDetailPage.tsx"
Cohesion: 0.36
Nodes (6): FindingCategory, FindingSeverity, SeverityPill(), SeverityPillProps, PublicProjectDetailPage(), FeedbackReport

### Community 57 - "ping"
Cohesion: 0.12
Nodes (16): concurrency, cancel-in-progress, group, jobs, ping, name, on, schedule (+8 more)

### Community 59 - "Wp"
Cohesion: 0.09
Nodes (45): dm(), r(), io(), Ni(), oD(), oo(), a(), c() (+37 more)

### Community 60 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, lucide-react@^1.63.0, @radix-ui/react-dialog@^1.3.1, @radix-ui/react-dropdown-menu@^2.2.1, @radix-ui/react-popover@^1.3.1, @radix-ui/react-tabs@^1.2.1, @radix-ui/react-tooltip@^1.4.1, react@^19.3.1 (+9 more)

### Community 61 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 63 - "ReviewWorker"
Cohesion: 0.15
Nodes (3): ReviewWorker, test_atomic_review_finalization_success(), test_worker_claiming_and_lease_renewal()

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

### Community 70 - "test_phase_7_e2e_journey.py"
Cohesion: 0.21
Nodes (5): create_test_user(), ensure_offline_ai(), test_complete_end_to_end_personal_journey(), test_reliability_and_idempotent_recovery(), test_security_adversarial_and_isolation_attacks()

### Community 71 - "test_phase_2_1_reconciliation.py"
Cohesion: 0.06
Nodes (18): get_auth_config(), create_mock_supabase_token(), get_active_auth_provider(), auth_users(), test_anonymous_comment_privacy(), test_anonymous_post_privacy_and_immutability(), test_atomic_vote_toggling_and_comment_counter_integrity(), test_input_validation_and_url_scheme_protection() (+10 more)

### Community 73 - "NvidiaNimProvider"
Cohesion: 0.20
Nodes (3): NvidiaNimProvider, test_nvidia_nim_markdown_fence_cleaning(), test_nvidia_nim_provider_headers()

### Community 75 - "database.types.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 76 - "create_mock_user"
Cohesion: 0.19
Nodes (6): create_auth_headers(), create_mock_user(), test_chat_session_lifecycle_and_ownership_isolation(), test_citation_hallucination_pruning_in_chat(), test_prompt_injection_in_comments_defended(), test_suggestions_endpoint()

### Community 79 - "r"
Cohesion: 0.09
Nodes (52): al(), ba(), bi(), ca(), cc(), a(), cl(), C() (+44 more)

### Community 81 - "at"
Cohesion: 0.09
Nodes (52): A(), an(), at(), bf(), Bt(), cf(), Je(), Ye() (+44 more)

### Community 84 - "t"
Cohesion: 0.10
Nodes (45): as(), bs(), Co(), createIndex(), cs(), da(), deleteVectors(), ds() (+37 more)

### Community 85 - "vite.config.ts"
Cohesion: 0.25
Nodes (6): @tailwindcss/vite@^4.3.3, vite@^8.3.5, @vitejs/plugin-react@^6.1.2, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 86 - "ProductDetailPage.tsx"
Cohesion: 0.11
Nodes (29): EmptyState(), EmptyStateProps, CardSkeleton(), FeedSkeleton(), FormSkeleton(), PageSkeleton(), Skeleton(), SkeletonProps (+21 more)

### Community 88 - "DocumentPreviewModal.tsx"
Cohesion: 0.67
Nodes (3): DocumentPreviewModal(), DocumentPreviewModalProps, PostDocument

### Community 89 - "constructor"
Cohesion: 0.06
Nodes (39): cD(), constructor(), a(), at(), ct(), dt(), ft(), gt() (+31 more)

### Community 91 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 93 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 97 - "services"
Cohesion: 0.14
Nodes (13): key, sync, value, services, buildCommand, env, envVars, healthCheckPath (+5 more)

### Community 125 - "v1/auth.py"
Cohesion: 0.05
Nodes (30): check_mfa_status(), confirm_email_endpoint(), confirm_reset(), _confirm_supabase_user_by_email(), EmailConfirmPayload, enroll_mfa(), get_me(), login() (+22 more)

### Community 130 - "po"
Cohesion: 0.07
Nodes (39): ao(), bc(), be(), bh(), ch(), Ci(), dt(), ei() (+31 more)

### Community 132 - "applyMatrix4"
Cohesion: 0.07
Nodes (41): addGroup(), ak(), applyAxisAngle(), applyEuler(), applyMatrix4(), applyQuaternion(), center(), computeBoundingBox() (+33 more)

### Community 133 - "_onChangeCallback"
Cohesion: 0.06
Nodes (39): angleTo(), applyMatrix3(), applyNormalMatrix(), clampLength(), conjugate(), divideScalar(), dot(), fromArray() (+31 more)

### Community 134 - "create_access_token"
Cohesion: 0.04
Nodes (26): create_access_token(), auth_headers(), client(), test_apk_release_lifecycle(), test_public_projects_sort_options(), test_recent_comments_endpoint(), client(), setup_product_data() (+18 more)

### Community 135 - "Ou"
Cohesion: 0.11
Nodes (38): Au(), bl(), bo(), Cu(), df(), Di(), eu(), fi() (+30 more)

### Community 136 - "b"
Cohesion: 0.09
Nodes (21): b(), Bp(), em(), c(), l(), u(), g(), gb() (+13 more)

### Community 137 - "l"
Cohesion: 0.11
Nodes (30): aa(), Ai(), ap(), bm(), dl(), Ee(), fl(), gl() (+22 more)

### Community 138 - "oy"
Cohesion: 0.16
Nodes (33): ay(), by(), cy(), dy(), Ey(), fy(), Gy(), Hv() (+25 more)

### Community 141 - "calculate_prioritization_score"
Cohesion: 0.15
Nodes (5): calculate_prioritization_score(), PrioritizationScoreBreakdown, ProductSuggestionService, test_deterministic_scoring_formula(), test_severity_keyword_detection()

### Community 145 - "n"
Cohesion: 0.08
Nodes (29): ee(), getIndex(), gg(), gu(), Hd(), hg(), r(), hu() (+21 more)

### Community 146 - "add"
Cohesion: 0.07
Nodes (31): add(), attach(), dispatchEvent(), eq(), _getHandJoint(), _getShaderCacheForMaterial(), getWorldDirection(), getWorldPosition() (+23 more)

### Community 147 - "send"
Cohesion: 0.08
Nodes (30): ajax(), batchSend(), cancelRefEvent(), cancelTimeout(), canPush(), close(), closeAndRetry(), destroy() (+22 more)

### Community 148 - "up"
Cohesion: 0.12
Nodes (27): bn(), cn(), en(), ge(), gn(), In(), t(), Kf() (+19 more)

### Community 149 - "project.py"
Cohesion: 0.14
Nodes (18): compare_feedback_reports(), Settings, AIReviewStatusResponse, FeedbackReportComparison, FeedbackReportRead, FindingComparisonItem, FindingEvidenceCitationRead, FindingRead (+10 more)

### Community 150 - "gp"
Cohesion: 0.18
Nodes (26): gp(), A(), be(), C(), D(), E(), fe(), ge() (+18 more)

### Community 151 - "GeminiAnalysisOutput"
Cohesion: 0.13
Nodes (7): GeminiAnalysisOutput, HybridAIProvider, MockGeminiProvider, test_author_generates_persisted_insights_and_public_access(), test_mock_gemini_provider_generates_valid_schema(), test_stale_analysis_detection_on_new_comment(), test_provider_failover_gemini_to_groq()

### Community 152 - "clear"
Cohesion: 0.10
Nodes (22): after(), before(), clear(), cloneRequestState(), delete(), deleteAt(), entryAt(), first() (+14 more)

### Community 153 - "GeminiProvider"
Cohesion: 0.11
Nodes (3): GeminiProvider, test_gemini_provider_missing_key_behavior(), test_missing_api_key_returns_503()

### Community 154 - "aD"
Cohesion: 0.16
Nodes (19): aD(), computeLineDistances(), ae(), b(), de(), ee(), he(), me() (+11 more)

### Community 155 - "zf"
Cohesion: 0.15
Nodes (19): Cr(), du(), fr(), gr(), hr(), Lr(), Mr(), Nr() (+11 more)

### Community 156 - "nm"
Cohesion: 0.24
Nodes (18): nm(), b(), c(), d(), E(), f(), g(), h() (+10 more)

### Community 157 - "P"
Cohesion: 0.27
Nodes (15): P(), a(), c(), d(), f(), h(), i(), l() (+7 more)

### Community 158 - "_binaryDecode"
Cohesion: 0.14
Nodes (15): assertFieldSize(), _binaryDecode(), binaryEncode(), _binaryEncodeUserBroadcastPush(), decode(), decodeBroadcast(), decodePush(), decodeReply() (+7 more)

### Community 159 - "wv"
Cohesion: 0.16
Nodes (15): av(), Bv(), Dv(), ev(), iv(), jv(), kv(), nv() (+7 more)

### Community 160 - "ka"
Cohesion: 0.19
Nodes (15): bu(), createBucket(), createSignedUploadUrl(), createSignedUrl(), createSignedUrls(), emptyBucket(), Iu(), ka() (+7 more)

### Community 161 - "toJSON"
Cohesion: 0.16
Nodes (11): clone(), getHex(), getHexString(), qA(), rj(), shift(), syncDiff(), syncState() (+3 more)

### Community 162 - "We"
Cohesion: 0.16
Nodes (14): d(), f(), g(), h(), l(), o(), p(), qe() (+6 more)

### Community 163 - "qd"
Cohesion: 0.28
Nodes (13): af(), Gd(), Jd(), nf(), qd(), qf(), rf(), Ud() (+5 more)

### Community 164 - "retrieve_evidence"
Cohesion: 0.17
Nodes (6): retrieve_evidence(), test_retrieval_service_produces_clean_evidence(), test_bm25_keyword_retrieval_ranking(), test_cross_post_evidence_isolation(), test_insufficient_evidence_detection(), test_retrieval_precision_recall_benchmark()

### Community 165 - "ef"
Cohesion: 0.32
Nodes (11): ef(), c(), d(), f(), g(), h(), l(), m() (+3 more)

### Community 166 - "NA"
Cohesion: 0.18
Nodes (11): catch(), execute(), exists(), FA(), finally(), fromEquirectangularTexture(), getPromise(), handleOperation() (+3 more)

### Community 167 - "setStyle"
Cohesion: 0.25
Nodes (11): DO(), getHSL(), lerpHSL(), offsetHSL(), set(), setColorName(), setHex(), setHSL() (+3 more)

### Community 168 - "dp"
Cohesion: 0.24
Nodes (6): dp(), c(), l(), o(), s(), fp()

### Community 169 - "tm"
Cohesion: 0.36
Nodes (10): tm(), c(), d(), f(), g(), h(), l(), m() (+2 more)

### Community 170 - "retrieval_service.py"
Cohesion: 0.20
Nodes (3): RetrievalResult, RetrievedComment, RetrievedThemeMatch

### Community 171 - "test_phase_4_chat_and_rag.py"
Cohesion: 0.22
Nodes (4): client(), setup_test_database(), test_chat_session_unauthenticated_returns_401(), test_product_suggestions_generation()

### Community 172 - "_fromTexture"
Cohesion: 0.29
Nodes (10): _allocateTarget(), _applyPMREM(), _blur(), fromCubemap(), fromEquirectangular(), fromScene(), _fromTexture(), _getSourceTarget() (+2 more)

### Community 173 - "distanceToPoint"
Cohesion: 0.22
Nodes (10): clampPoint(), distanceSqToPoint(), distanceToPoint(), distanceToSphere(), intersectLine(), intersectsLine(), intersectsObject(), intersectsSphere() (+2 more)

### Community 175 - "cm"
Cohesion: 0.39
Nodes (8): cm(), a(), c(), i(), l(), o(), s(), u()

### Community 176 - "getValueSize"
Cohesion: 0.25
Nodes (8): getValueSize(), InterpolantFactoryMethodBezier(), InterpolantFactoryMethodDiscrete(), InterpolantFactoryMethodLinear(), InterpolantFactoryMethodSmooth(), optimize(), trim(), validate()

### Community 177 - "Pg"
Cohesion: 0.29
Nodes (7): Bg(), dg(), lg(), Pg(), ug(), Wg(), zg()

### Community 178 - "updateProjectionMatrix"
Cohesion: 0.29
Nodes (7): clearViewOffset(), getFilmHeight(), getFilmWidth(), getFocalLength(), setFocalLength(), setViewOffset(), updateProjectionMatrix()

### Community 179 - "evaluate"
Cohesion: 0.33
Nodes (7): copySampleValue_(), ej(), evaluate(), getSettings_(), interpolate_(), intervalChanged_(), tj()

### Community 180 - "bind"
Cohesion: 0.40
Nodes (6): bind(), getValue(), _getValue_unbound(), setOptional(), setValue(), _setValue_unbound()

### Community 181 - "_denormalize"
Cohesion: 0.33
Nodes (6): _denormalize(), getComponent(), getW(), getX(), getY(), getZ()

### Community 182 - "subscribe"
Cohesion: 0.33
Nodes (6): _notThisChannelEvent(), subscribe(), unsubscribe(), _updateFilterMessage(), updateJoinPayload(), _updatePostgresBindings()

### Community 183 - "Yj"
Cohesion: 0.47
Nodes (4): Yj(), n(), o(), r()

### Community 184 - "ah"
Cohesion: 0.40
Nodes (5): ah(), dh(), oh(), sh(), uh()

### Community 185 - "download"
Cohesion: 0.50
Nodes (5): applyTransformOptsToQuery(), download(), _getFinalPath(), getPublicUrl(), Ra()

### Community 186 - "ta"
Cohesion: 0.40
Nodes (5): dropNamespace(), listNamespaces(), loadNamespaceMetadata(), namespaceExists(), ta()

### Community 187 - "parseJSON"
Cohesion: 0.60
Nodes (5): fetchRequest(), parseJSON(), request(), xdomainRequest(), xhrRequest()

### Community 188 - "Kh"
Cohesion: 0.50
Nodes (4): Kh(), n(), t(), qh()

### Community 189 - "wu"
Cohesion: 0.40
Nodes (5): nh(), th(), Tu(), Uu(), wu()

### Community 190 - "ag"
Cohesion: 0.50
Nodes (4): ag(), ig(), og(), Sg()

### Community 191 - "_computeIntersections"
Cohesion: 0.50
Nodes (4): _computeIntersections(), raycast(), Xk(), Yk()

### Community 192 - "eD"
Cohesion: 0.50
Nodes (4): eD(), getDataURL(), sRGBToLinear(), tD()

### Community 193 - "getDelta"
Cohesion: 0.50
Nodes (4): getDelta(), getElapsedTime(), start(), stop()

### Community 194 - "translateOnAxis"
Cohesion: 0.50
Nodes (4): translateOnAxis(), translateX(), translateY(), translateZ()

### Community 195 - "ax"
Cohesion: 0.67
Nodes (3): ax(), cx(), rx()

### Community 196 - "_compileMaterial"
Cohesion: 0.67
Nodes (3): compileCubemapShader(), compileEquirectangularShader(), _compileMaterial()

### Community 197 - "copyLinearToSRGB"
Cohesion: 0.67
Nodes (3): convertLinearToSRGB(), copyLinearToSRGB(), ND()

### Community 198 - "createTableIfNotExists"
Cohesion: 0.67
Nodes (3): createTable(), createTableIfNotExists(), loadTable()

### Community 199 - "determinantAffine"
Cohesion: 0.67
Nodes (3): decompose(), determinantAffine(), extractBasis()

### Community 200 - "detectEnvironment"
Cohesion: 0.67
Nodes (3): detectEnvironment(), getWebSocketConstructor(), isWebSocketSupported()

### Community 201 - "_getShaderStage"
Cohesion: 0.67
Nodes (3): getFragmentShaderStage(), _getShaderStage(), getVertexShaderStage()

### Community 202 - "getObjectByProperty"
Cohesion: 0.67
Nodes (3): getObjectById(), getObjectByName(), getObjectByProperty()

### Community 203 - "rejoin"
Cohesion: 0.67
Nodes (3): isLeaving(), join(), rejoin()

### Community 204 - "mh"
Cohesion: 0.67
Nodes (3): mh(), ph(), ut()

## Knowledge Gaps
- **66 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CommunityRepository` connect `CommunityRepository` to `.update_research_report`, `typing`, `.get_comment`, `._serialize_product_review`, `._serialize_post`, `.create_user`, `utc_now_iso`, `Any`, `.create_chat_session`, `.save_analysis_run`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 102 inferred relationships involving `n()` (e.g. with `ac()` and `add()`) actually correct?**
  _`n()` has 102 INFERRED edges - model-reasoned connections that need verification._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03772893772893773 - nodes in this community are weakly interconnected._
- **Why does `clean_evidence_quote()` connect `AdvancedRAGEngine` to `typing`, `retrieve_evidence`, `ProjectChatAndWorkflowService`, `.retrieve_evidence`, `AIOrchestratorService`, `retrieval_service.py`, `ai_orchestrator.py`, `comprehensive_intelligence_service.py`, `pytest`, `CompletenessMapService`, `WebIntelligenceService`, `review_service.py`, `SourceIngestionService`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 87 inferred relationships involving `t()` (e.g. with `index-Cwmh5e-w.js` and `add()`) actually correct?**
  _`t()` has 87 INFERRED edges - model-reasoned connections that need verification._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Why does `ProjectRepository` connect `ProjectRepository` to `typing`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._