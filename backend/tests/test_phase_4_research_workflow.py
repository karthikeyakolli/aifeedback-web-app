import time
import io
import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.auth_service import create_access_token
from backend.app.db.repository import community_repo
from backend.app.schemas.ai import ResearchAnswerProposal
from backend.app.services.gemini_service import HybridAIProvider, MockGeminiProvider, GeminiRateLimitError


@pytest.fixture
def client():
    return TestClient(app)


def test_research_chat_session_lifecycle_and_rename(client):
    """Verifies creating, listing, renaming, and deleting research chat sessions with ownership checks."""
    uid = uuid.uuid4().hex[:8]

    # 1. Create Post Creator
    creator_id, _ = community_repo.create_user(
        email=f"creator_{uid}@example.com",
        password="Password123!",
        username=f"creator_{uid}",
        display_name="Product Creator",
    )
    creator_token = create_access_token(
        user_id=creator_id, email=f"creator_{uid}@example.com", username=f"creator_{uid}"
    )
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    # 2. Create Unauthorized Visitor
    visitor_id, _ = community_repo.create_user(
        email=f"visitor_{uid}@example.com",
        password="Password123!",
        username=f"visitor_{uid}",
        display_name="Visitor",
    )
    visitor_token = create_access_token(
        user_id=visitor_id, email=f"visitor_{uid}@example.com", username=f"visitor_{uid}"
    )
    visitor_headers = {"Authorization": f"Bearer {visitor_token}"}

    # 3. Post discussion
    post_res = client.post(
        "/api/v1/posts",
        json={
            "title": f"Phase 4 Studio Workspace {uid}",
            "description": "Deep research intelligence for product iteration.",
            "postType": "product_review",
            "category": "Developer Tools",
            "tags": ["AI", "Research"],
        },
        headers=creator_headers,
    )
    assert post_res.status_code == 201
    post_id = post_res.json()["id"]

    # 4. Create chat session
    create_sess = client.post(
        f"/api/v1/ai/{post_id}/chat/sessions",
        json={"title": "Sprint 1 Discovery"},
        headers=creator_headers,
    )
    assert create_sess.status_code == 201
    sess_data = create_sess.json()
    session_id = sess_data["id"]
    assert sess_data["title"] == "Sprint 1 Discovery"

    # 5. List chat sessions
    list_sess = client.get(
        f"/api/v1/ai/{post_id}/chat/sessions",
        headers=creator_headers,
    )
    assert list_sess.status_code == 200
    sessions_list = list_sess.json()
    assert len(sessions_list) >= 1
    assert any(s["id"] == session_id for s in sessions_list)

    # 6. Rename chat session
    rename_res = client.put(
        f"/api/v1/ai/chat/sessions/{session_id}",
        json={"title": "Sprint 1 Architecture & Friction"},
        headers=creator_headers,
    )
    assert rename_res.status_code == 200
    assert rename_res.json()["title"] == "Sprint 1 Architecture & Friction"

    # 7. Unauthorized visitor attempt to rename session
    unauth_rename = client.put(
        f"/api/v1/ai/chat/sessions/{session_id}",
        json={"title": "Hacked Title"},
        headers=visitor_headers,
    )
    assert unauth_rename.status_code == 404

    # 8. Delete session with ownership check
    del_res = client.delete(
        f"/api/v1/ai/chat/sessions/{session_id}",
        headers=creator_headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


def test_research_workflow_source_selection_and_ownership(client):
    """Verifies 15-stage workflow, source selection (community, documents, both), and strict ownership."""
    uid = uuid.uuid4().hex[:8]

    # 1. Create Post Creator
    creator_id, _ = community_repo.create_user(
        email=f"owner_{uid}@example.com",
        password="Password123!",
        username=f"owner_{uid}",
        display_name="Project Owner",
    )
    creator_token = create_access_token(
        user_id=creator_id, email=f"owner_{uid}@example.com", username=f"owner_{uid}"
    )
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    # 2. Create Unauthorized Visitor
    visitor_id, _ = community_repo.create_user(
        email=f"stranger_{uid}@example.com",
        password="Password123!",
        username=f"stranger_{uid}",
        display_name="Stranger",
    )
    visitor_token = create_access_token(
        user_id=visitor_id, email=f"stranger_{uid}@example.com", username=f"stranger_{uid}"
    )
    visitor_headers = {"Authorization": f"Bearer {visitor_token}"}

    # 3. Create discussion
    post_res = client.post(
        "/api/v1/posts",
        json={
            "title": f"Telemetry Pipeline Architecture {uid}",
            "description": "Designing high-throughput event logging.",
            "postType": "product_review",
            "category": "Developer Tools",
            "tags": ["Telemetry", "Kafka"],
        },
        headers=creator_headers,
    )
    assert post_res.status_code == 201
    post_id = post_res.json()["id"]

    # 4. Attach creator project document
    doc_content = (
        "# System Architecture Specification\n\n"
        "--- [Page 1] ---\n"
        "The telemetry pipeline uses Kafka buffers with WebSocket streaming.\n\n"
        "--- [Page 2] ---\n"
        "Security constraints mandate zero plain-text passwords and strict TLS 1.3 encryption.\n"
    )
    file_bytes = io.BytesIO(doc_content.encode("utf-8"))
    upload_res = client.post(
        f"/api/v1/posts/{post_id}/documents",
        files={"file": ("spec.md", file_bytes, "text/markdown")},
        headers=creator_headers,
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    # 5. Add community comment
    cmt_res = client.post(
        "/api/v1/comments",
        json={
            "postId": post_id,
            "content": "WebSocket connection drops frequently during cellular handover.",
            "isAnonymous": False,
        },
        headers=creator_headers,
    )
    assert cmt_res.status_code == 201
    comment_id = cmt_res.json()["id"]

    # 6. Create Research Session
    sess_res = client.post(
        f"/api/v1/ai/{post_id}/chat/sessions",
        json={"title": "Technical Investigation"},
        headers=creator_headers,
    )
    assert sess_res.status_code == 201
    session_id = sess_res.json()["id"]

    # 7. Research with sourceType='both' (with retry for external API rate limits)
    msg_both = None
    for attempt in range(4):
        msg_both = client.post(
            f"/api/v1/ai/chat/sessions/{session_id}/messages",
            json={
                "question": "What connection and security problems were reported?",
                "sourceType": "both",
                "includedDocIds": [doc_id],
                "includeCommunity": True,
            },
            headers=creator_headers,
        )
        if msg_both.status_code == 200:
            break
        time.sleep(8.0)
    assert msg_both.status_code == 200
    res_data = msg_both.json()

    # Verify 15 completed stages returned
    stages = res_data.get("stagesCompleted", [])
    assert len(stages) >= 14
    assert any("Ownership validation" in s for s in stages)
    assert any("Document retrieval" in s for s in stages)
    assert any("BM25 retrieval" in s for s in stages)
    assert any("Citation verification" in s for s in stages)

    # Verify deterministic metrics
    metrics = res_data.get("deterministicMetrics", {})
    assert metrics["sourceTypeUsed"] == "both"
    assert metrics["totalAttachedDocuments"] >= 1
    assert metrics["totalCommentsInPost"] >= 1

    # Verify structured fields
    assert res_data.get("directAnswer")
    assert res_data.get("executiveSummary")
    assert isinstance(res_data.get("keyFindings"), list)

    # 8. Research with sourceType='community'
    msg_comm = client.post(
        f"/api/v1/ai/chat/sessions/{session_id}/messages",
        json={
            "question": "What are contributors saying about cellular handover?",
            "sourceType": "community",
            "includeCommunity": True,
        },
        headers=creator_headers,
    )
    assert msg_comm.status_code == 200
    assert msg_comm.json()["deterministicMetrics"]["sourceTypeUsed"] == "community"

    # 9. Research with sourceType='documents'
    msg_docs = client.post(
        f"/api/v1/ai/chat/sessions/{session_id}/messages",
        json={
            "question": "What are the mandated security constraints in the specification?",
            "sourceType": "documents",
            "includedDocIds": [doc_id],
        },
        headers=creator_headers,
    )
    assert msg_docs.status_code == 200
    assert msg_docs.json()["deterministicMetrics"]["sourceTypeUsed"] == "documents"

    # 10. Unauthorized visitor direct request returns 404 (session owned by creator)
    unauth_msg = client.post(
        f"/api/v1/ai/chat/sessions/{session_id}/messages",
        json={"question": "Tell me secrets"},
        headers=visitor_headers,
    )
    assert unauth_msg.status_code == 404


def test_deliverables_generation_and_pdf_export(client):
    """Verifies generation of PRD, Engineering Investigation, Improvement Roadmap, and Analytical Report, plus PDF export."""
    uid = uuid.uuid4().hex[:8]

    creator_id, _ = community_repo.create_user(
        email=f"deliverable_{uid}@example.com",
        password="Password123!",
        username=f"deliv_{uid}",
        display_name="Deliverables Lead",
    )
    creator_token = create_access_token(
        user_id=creator_id, email=f"deliverable_{uid}@example.com", username=f"deliv_{uid}"
    )
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    post_res = client.post(
        "/api/v1/posts",
        json={
            "title": f"Production Scaling {uid}",
            "description": "Designing resilient architecture for million-user load.",
            "postType": "product_review",
            "category": "Developer Tools",
            "tags": ["Scaling", "Architecture"],
        },
        headers=creator_headers,
    )
    assert post_res.status_code == 201
    post_id = post_res.json()["id"]

    # Add community feedback
    client.post(
        "/api/v1/comments",
        json={"postId": post_id, "content": "Cache invalidation on distributed clusters is tricky.", "isAnonymous": False},
        headers=creator_headers,
    )

    # 1. Generate PRD
    prd_res = client.post(
        f"/api/v1/ai/{post_id}/reports/generate",
        json={"reportType": "prd", "customFocus": "Cache resilience"},
        headers=creator_headers,
    )
    assert prd_res.status_code == 201
    prd_data = prd_res.json()
    assert "Product Requirement Document" in prd_data["title"]
    assert "## 1. Problem Statement" in prd_data["contentMarkdown"]
    assert "## 2. Goals & Non-Goals" in prd_data["contentMarkdown"]

    # 2. Generate Engineering Investigation
    eng_res = client.post(
        f"/api/v1/ai/{post_id}/reports/generate",
        json={"reportType": "engineering_investigation"},
        headers=creator_headers,
    )
    assert eng_res.status_code == 201
    eng_data = eng_res.json()
    assert "Technical Investigation" in eng_data["title"]
    assert "## 1. Technical Concerns" in eng_data["contentMarkdown"]
    assert "## 2. Architectural Impact" in eng_data["contentMarkdown"]
    assert "## 4. Security, Access Control" in eng_data["contentMarkdown"]

    # 3. Generate Improvement Roadmap
    road_res = client.post(
        f"/api/v1/ai/{post_id}/reports/generate",
        json={"reportType": "improvement_roadmap"},
        headers=creator_headers,
    )
    assert road_res.status_code == 201
    road_data = road_res.json()
    assert "Improvement Roadmap" in road_data["title"]
    assert "## 2. Short-Term Fixes" in road_data["contentMarkdown"]
    assert "## 3. Mid-Term Enhancements" in road_data["contentMarkdown"]
    assert "## 5. Success Metrics" in road_data["contentMarkdown"]

    # 4. Generate Analytical Report
    rep_res = client.post(
        f"/api/v1/ai/{post_id}/reports/generate",
        json={"reportType": "analytical_report"},
        headers=creator_headers,
    )
    assert rep_res.status_code == 201
    rep_data = rep_res.json()
    assert "Analytical Research Report" in rep_data["title"]
    assert "## 1. Executive Summary" in rep_data["contentMarkdown"]
    assert "## 2. Methodology" in rep_data["contentMarkdown"]

    # 5. Download Report as PDF
    pdf_res = client.get(
        f"/api/v1/ai/reports/{rep_data['id']}/download?format=pdf",
        headers=creator_headers,
    )
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers.get("content-type", "")
    assert pdf_res.content.startswith(b"%PDF")


def test_provider_failover_gemini_to_groq():
    """Verifies that HybridAIProvider seamlessly fails over when primary provider throws rate limit or timeout."""
    failing_primary = MockGeminiProvider(should_fail=True, failure_type="rate_limit")
    working_fallback = MockGeminiProvider(should_fail=False)

    hybrid = HybridAIProvider(primary=failing_primary, fallback=working_fallback)

    response = hybrid.generate_chat_response(
        post_title="Failover Test Discussion",
        post_description="Testing automatic failover",
        post_category="general",
        retrieved_comments=[{"id": "cmt_01", "content": "FastAPI is responsive"}],
        matching_themes=[],
        conversation_history=[],
        user_question="Is failover operational?",
    )

    assert isinstance(response, ResearchAnswerProposal)
    assert "Failover Test Discussion" in response.direct_answer
    assert response.supporting_comment_ids == ["cmt_01"]
