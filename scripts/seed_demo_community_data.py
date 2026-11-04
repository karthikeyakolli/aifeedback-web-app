"""Seed realistic users, products, and rich community reviews for Product Research Intelligence.

Creates:
1. Product Creator: Sarah Chen (sarah.chen@example.com / demo-password-123)
2. Reviewers:
   - Daniel Thorne (dan@example.com / demo-password-123) - Senior Frontend Engineer
   - Elena Rostova (elena.ux@example.com / demo-password-123) - Staff Product Designer
   - Marcus Vance (marcus.tech@example.com / demo-password-123) - Principal Infrastructure Architect
   - Alex Rivera (alex.pm@example.com / demo-password-123) - Technical Product Manager
3. Rich reviews and threaded discussions on ReflectTask (post_reflect_01) and ReflectFlow (post_synth_reflectflow_01)
4. Uploaded project documents with page markers for BM25 citation testing.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from backend.app.db.connection import db_manager
from backend.app.services.auth_service import hash_password


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def seed_demo_data():
    now = utc_now()
    hashed_pass = hash_password("demo-password-123")

    with db_manager.session() as conn:
        # =====================================================================
        # 1. Create or Update Users
        # =====================================================================
        users = [
            {
                "id": "usr_sarah_chen",
                "email": "sarah.chen@example.com",
                "username": "sarahc",
                "display_name": "Sarah Chen",
                "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
                "bio": "Founder & Product Creator at ReflectTask. Building keyboard-first developer productivity tools.",
                "reputation": 450,
                "is_moderator": 0,
            },
            {
                "id": "usr_dev_dan",
                "email": "dan@example.com",
                "username": "devdan",
                "display_name": "Daniel Thorne",
                "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
                "bio": "Senior Frontend Engineer & OSS enthusiast. Passionate about developer tooling, shortcuts, and snappy UI.",
                "reputation": 320,
                "is_moderator": 0,
            },
            {
                "id": "usr_elena_ux",
                "email": "elena.ux@example.com",
                "username": "elena_ux",
                "display_name": "Elena Rostova",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
                "bio": "Staff Product Designer. Obsessed with interaction design, mental models, accessibility & design systems.",
                "reputation": 290,
                "is_moderator": 0,
            },
            {
                "id": "usr_marcus_v",
                "email": "marcus.tech@example.com",
                "username": "marcus_v",
                "display_name": "Marcus Vance",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
                "bio": "Principal Infrastructure Architect. Distributed databases, offline-first architectures, CRDTs and WebAssembly.",
                "reputation": 510,
                "is_moderator": 0,
            },
            {
                "id": "usr_alex_pm",
                "email": "alex.pm@example.com",
                "username": "alex_pm",
                "display_name": "Alex Rivera",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
                "bio": "Technical Product Manager. Focused on developer workflows, integrations (Linear, GitHub, Slack), and sprint velocity.",
                "reputation": 240,
                "is_moderator": 0,
            },
            {
                "id": "usr_mod_charlie",
                "email": "mod@example.com",
                "username": "charlie_mod",
                "display_name": "Charlie Moderator",
                "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
                "bio": "Community Lead & Trust & Safety Moderator at ResearchIntel.",
                "reputation": 890,
                "is_moderator": 1,
            },
        ]

        for u in users:
            conn.execute(
                """INSERT INTO auth_users (id, email, hashed_password, created_at)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET email=excluded.email, hashed_password=excluded.hashed_password""",
                (u["id"], u["email"], hashed_pass, now),
            )
            conn.execute(
                """INSERT INTO profiles (id, username, display_name, avatar_url, bio, reputation_score, is_moderator, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET 
                        username=excluded.username,
                        display_name=excluded.display_name,
                        avatar_url=excluded.avatar_url,
                        bio=excluded.bio,
                        reputation_score=excluded.reputation_score,
                        is_moderator=excluded.is_moderator,
                        updated_at=excluded.updated_at""",
                (u["id"], u["username"], u["display_name"], u["avatar_url"], u["bio"], u["reputation"], u["is_moderator"], now, now),
            )

        print(f"Created/verified {len(users)} test users with password 'demo-password-123'.")

        # =====================================================================
        # 2. Update Primary Application Discussion: ReflectTask (post_reflect_01)
        # =====================================================================
        post_id = "post_reflect_01"
        post_desc = (
            "Hi everyone! I'm Sarah, founder of ReflectTask. ReflectTask is an offline-first daily task planner "
            "and execution dashboard built specifically for developers and power users who prefer keyboard navigation "
            "over point-and-click UI.\n\n"
            "We recently shipped our Beta v1.2 with local SQLite caching, fast fuzzy search, and Markdown task notes.\n\n"
            "We are looking for your critical feedback on:\n"
            "1. Onboarding clarity — is the command palette (Cmd+K) and initial setup easy to grasp?\n"
            "2. Sync reliability & offline-to-cloud handshakes.\n"
            "3. Missing integrations that prevent you from using this as your daily driver (e.g. Google Calendar, Linear, GitHub).\n"
            "4. Performance with large workspaces (1,000+ tasks).\n\n"
            "Please be brutal! What's working, what's broken, and what should we build next?"
        )

        conn.execute(
            """INSERT INTO posts (
                id, author_id, title, description, post_type, product_url, category, tags,
                is_anonymous, upvotes_count, comments_count, status, created_at, updated_at
            ) VALUES (?, 'usr_sarah_chen', ?, ?, 'product_review', 'https://reflecttask.app', 'Developer Tools', ?, 0, 42, 7, 'published', ?, ?)
            ON CONFLICT(id) DO UPDATE SET 
                title=excluded.title,
                description=excluded.description,
                product_url=excluded.product_url,
                category=excluded.category,
                tags=excluded.tags,
                comments_count=7,
                upvotes_count=42,
                updated_at=excluded.updated_at""",
            (
                post_id,
                "ReflectTask: Keyboard-first daily task planner. Looking for honest onboarding & sync feedback.",
                post_desc,
                json.dumps(["productivity", "keyboard-first", "onboarding", "sync", "developer-tools"]),
                now,
                now,
            ),
        )

        # =====================================================================
        # 3. Seed Diverse Community Reviews & Replies on post_reflect_01
        # =====================================================================
        # Clear existing comments on post_reflect_01 to avoid duplicate collisions
        conn.execute("DELETE FROM comments WHERE post_id = ?", (post_id,))

        comments = [
            {
                "id": "cmt_reflect_01_onboarding",
                "post_id": post_id,
                "parent_id": None,
                "author_id": "usr_dev_dan",
                "content": (
                    "The keyboard-first navigation is great once you know it, but the first-run onboarding is very disorienting. "
                    "When I first loaded the screen, I was confronted with a blank canvas and no hints on what key to press. "
                    "I had to guess Cmd+K to open the command palette. Please add an interactive 3-step onboarding walkthrough "
                    "or a visible cheat-sheet for new users."
                ),
                "is_anonymous": 1,
                "upvotes_count": 18,
                "is_helpful": 1,
            },
            {
                "id": "cmt_reflect_01_creator_reply",
                "post_id": post_id,
                "parent_id": "cmt_reflect_01_onboarding",
                "author_id": "usr_sarah_chen",
                "content": (
                    "Thanks Dan! That is a huge blind spot for us because our team uses the shortcuts subconsciously. "
                    "We're designing a lightweight interactive checklist that shows common shortcuts during the first session."
                ),
                "is_anonymous": 0,
                "upvotes_count": 9,
                "is_helpful": 1,
            },
            {
                "id": "cmt_reflect_02_sync_bug",
                "post_id": post_id,
                "parent_id": None,
                "author_id": "usr_elena_ux",
                "content": (
                    "Critical friction on iOS and iPad: whenever I edit a task checklist on my iPad and then switch to desktop, "
                    "I get a modal saying 'sync conflict occurred' and my last 2 items get rolled back. Your spec says automatic "
                    "CRDT merge without user disruption, but this modal interrupts work and causes data loss concerns."
                ),
                "is_anonymous": 0,
                "upvotes_count": 27,
                "is_helpful": 1,
            },
            {
                "id": "cmt_reflect_02_marcus_analysis",
                "post_id": post_id,
                "parent_id": "cmt_reflect_02_sync_bug",
                "author_id": "usr_marcus_v",
                "content": (
                    "I inspected the network payloads and it looks like vector clocks aren't persisting across tab suspensions on WebKit. "
                    "If the OPFS sync batch is aborted halfway, the server rejects the next batch as divergent. The client needs idempotent delta reconciliation."
                ),
                "is_anonymous": 0,
                "upvotes_count": 21,
                "is_helpful": 1,
            },
            {
                "id": "cmt_reflect_03_integrations",
                "post_id": post_id,
                "parent_id": None,
                "author_id": "usr_alex_pm",
                "content": (
                    "The daily planner view is slick, but it currently lives in an island. Without bidirectional Google Calendar "
                    "time-blocking and two-way Linear/GitHub issue sync, I can't adopt this as my daily driver. I have to manually "
                    "copy action items from our sprint board into ReflectTask every morning."
                ),
                "is_anonymous": 0,
                "upvotes_count": 24,
                "is_helpful": 1,
            },
            {
                "id": "cmt_reflect_04_memory_risk",
                "post_id": post_id,
                "parent_id": None,
                "author_id": "usr_marcus_v",
                "content": (
                    "We benchmarked ReflectTask with a workspace of 2,500 tasks. The initial SQLite WASM index creation spiked CPU "
                    "to 100% for 4 seconds, and memory hovered around 180MB. The tombstone records from deleted tasks don't seem "
                    "to get vacuumed, which might cause mobile browsers to drop the tab during background sync."
                ),
                "is_anonymous": 0,
                "upvotes_count": 32,
                "is_helpful": 1,
            },
            {
                "id": "cmt_reflect_05_praise_speed",
                "post_id": post_id,
                "parent_id": None,
                "author_id": "usr_elena_ux",
                "content": (
                    "On desktop, the fuzzy search latency is astonishing. Instant filtering across 1,000 items with zero network roundtrip "
                    "puts Notion and ClickUp to shame. If you fix the onboarding and mobile sync glitch, this is an instant subscription for our design team."
                ),
                "is_anonymous": 0,
                "upvotes_count": 16,
                "is_helpful": 0,
            },
        ]

        for c in comments:
            conn.execute(
                """INSERT INTO comments (
                    id, post_id, parent_comment_id, author_id, content,
                    is_anonymous, upvotes_count, is_helpful_flag, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)""",
                (
                    c["id"],
                    c["post_id"],
                    c["parent_id"],
                    c["author_id"],
                    c["content"],
                    c["is_anonymous"],
                    c["upvotes_count"],
                    c["is_helpful"],
                    now,
                    now,
                ),
            )

        print(f"Seeded {len(comments)} rich reviews and replies on {post_id}.")

        # =====================================================================
        # 4. Attach Rich Project Documents to post_reflect_01
        # =====================================================================
        conn.execute("DELETE FROM post_documents WHERE post_id = ?", (post_id,))

        doc_prd_content = """--- Page 1: Executive Overview & Sync Protocol ---
# ReflectTask Product Requirements Document (PRD) v1.2

## 1. Product Overview
ReflectTask is a high-velocity, keyboard-first task manager for engineering teams and technical founders. It emphasizes local-first persistence, zero round-trip latency on editing, and automatic peer synchronization.

## 2. Synchronization Architecture
- **Local Persistence**: Embedded SQLite WebAssembly with OPFS (Origin Private File System).
- **Conflict Strategy**: Conflict-free Replicated Data Types (CRDT) using Yjs state vectors. Under normal operation, mutations should automatically converge without presenting blocking manual conflict modals to the end-user.
- **Offline Protocol**: Mutations are queued locally and broadcast upon network recovery.

--- Page 2: Performance Constraints & Resource Budgets ---
## 3. Resource Budgets
- Idle memory footprint on mobile Safari / Chrome: Maximum 45MB.
- Task search latency: Sub-15ms for workspaces containing up to 5,000 tasks.
- Background sync duration: Under 250ms per batch.

## 4. Known Gaps & Feedback Under Review
- First-time user onboarding and keyboard shortcut discoverability.
- Multi-device tab suspension conflict edge cases on iOS Safari.
- Third-party tool integrations for Linear, GitHub Issues, and Google Calendar.

--- Page 3: Integration Roadmap ---
## 5. Planned Integrations
- Phase 1: Google Calendar 2-way event time-blocking.
- Phase 2: Bidirectional Linear & GitHub issue synchronization.
- Phase 3: Webhook event broadcast for team automation.
"""

        doc_arch_content = """--- Page 1: WASM SQLite Storage Subsystem ---
[Architecture Specification: ReflectTask Core Engine]

1. Storage Subsystem Overview
ReflectTask compiles SQLite 3.45 to WebAssembly targeting modern web workers. Persistence is managed through the Origin Private File System (OPFS) with Write-Ahead Logging (WAL) enabled.

2. Tombstone Retention & Vacuuming Policy
When tasks or checklist items are deleted, soft tombstone records are created to guarantee causal ordering during CRDT synchronization. 

--- Page 2: Known Technical Pitfalls & CRDT Reconciler ---
Known Architectural Pitfalls & Memory Profile:
1. Tombstone Accumulation: In high-mutation sessions, retaining uncompacted tombstones longer than 7 days causes the JavaScript heap to exceed 160MB on constrained mobile devices.
2. WebKit Tab Suspension: On iOS Safari, background tab freezing interrupts active OPFS write locks, occasionally triggering premature conflict rollbacks.
"""

        conn.execute(
            """INSERT INTO post_documents (id, post_id, owner_id, filename, file_type, file_size, content_text, created_at)
               VALUES ('doc_reflect_prd', ?, 'usr_sarah_chen', 'reflect_prd_spec.md', 'text/markdown', ?, ?, ?)""",
            (post_id, len(doc_prd_content), doc_prd_content, now),
        )

        conn.execute(
            """INSERT INTO post_documents (id, post_id, owner_id, filename, file_type, file_size, content_text, created_at)
               VALUES ('doc_reflect_arch', ?, 'usr_sarah_chen', 'reflect_architecture_whitepaper.pdf', 'application/pdf', ?, ?, ?)""",
            (post_id, len(doc_arch_content), doc_arch_content, now),
        )

        print("Attached 2 project documents with page markers to post_reflect_01.")


if __name__ == "__main__":
    seed_demo_data()
    print("Demo community data seeded successfully!")
