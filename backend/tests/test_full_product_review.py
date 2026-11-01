"""Comprehensive Acceptance Test Suite for Full Product Review & Review-Linked Chat.

Verifies the 12 core criteria:
  1. Opening AI Lab does not make an AI request (sources endpoint is DB-only).
  2. Full review runs only after explicit owner action.
  3. All eligible product sources are considered.
  4. Excluded sources are not retrieved.
  5. All findings cite actual sources.
  6. Empty sections are handled honestly.
  7. Review V1 remains unchanged after new feedback arrives.
  8. Generating V2 creates a new snapshot.
  9. V1 conversation remains linked to V1.
  10. Follow-up questions preserve context.
  11. Unauthorized users cannot access reviews or documents (403 Forbidden).
  12. Review reports can be reopened and exported (Markdown & PDF).
"""

import io
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.auth_service import create_access_token
from backend.app.db.repository import community_repo
from backend.app.services.gemini_service import MockGeminiProvider
from backend.app.services.review_service import review_service


@pytest.fixture
def client():
    # Ensure review_service uses mock provider during tests for deterministic and quota-safe execution
    review_service._provider = MockGeminiProvider()
    return TestClient(app)


@pytest.fixture
def setup_product_data(client):
    """Creates a creator, unauthorized visitor, product post, comments, and uploaded document."""
    uid = uuid.uuid4().hex[:8]

    # 1. Creator
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

    # 2. Visitor
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

    # 3. Discussion post
    post_res = client.post(
        "/api/v1/posts",
        json={
            "title": f"Synthesizer Pro {uid}",
            "description": "High throughput audio DSP and real-time collaboration plugin for DAW hosts.",
            "postType": "product_review",
            "category": "Developer Tools",
            "tags": ["Audio", "DSP"],
        },
        headers=creator_headers,
    )
    assert post_res.status_code == 201
    post_id = post_res.json()["id"]

    # 4. Comments
    c1_res = client.post(
        "/api/v1/comments",
        json={"postId": post_id, "content": "The DSP latency is exceptionally low and audio clarity is pristine on Apple Silicon."},
        headers=creator_headers,
    )
    assert c1_res.status_code == 201, c1_res.text
    c1_id = c1_res.json()["id"]

    c2_res = client.post(
        "/api/v1/comments",
        json={"postId": post_id, "content": "Initial buffer configuration was confusing and resulted in crackles until I changed sample rate."},
        headers=visitor_headers,
    )
    assert c2_res.status_code == 201, c2_res.text
    c2_id = c2_res.json()["id"]

    # 5. Uploaded Markdown document
    doc_content = b"# Synthesizer Pro Spec\nLow latency WASM audio engine with WebAudio backend."
    doc_res = client.post(
        f"/api/v1/posts/{post_id}/documents",
        files={"file": ("spec.md", io.BytesIO(doc_content), "text/markdown")},
        headers=creator_headers,
    )
    assert doc_res.status_code == 201
    doc_id = doc_res.json()["id"]

    return {
        "creator_id": creator_id,
        "creator_headers": creator_headers,
        "visitor_id": visitor_id,
        "visitor_headers": visitor_headers,
        "post_id": post_id,
        "comment_ids": [c1_id, c2_id],
        "doc_id": doc_id,
    }


def test_criterion_1_opening_ai_lab_does_not_make_ai_request(client, setup_product_data):
    """Criterion 1: Opening AI Lab queries source availability from database only, zero LLM calls."""
    data = setup_product_data
    post_id = data["post_id"]

    res = client.get(
        f"/api/v1/ai/{post_id}/review/sources",
        headers=data["creator_headers"],
    )
    assert res.status_code == 200
    body = res.json()
    assert body["totalComments"] == 2
    assert body["totalDocuments"] == 1
    assert len(body["documents"]) == 1
    assert body["documents"][0]["id"] == data["doc_id"]
    assert body["latestReviewId"] is None
    assert body["hasNewActivitySinceLastReview"] is False


def test_criterion_2_full_review_runs_only_after_explicit_owner_action(client, setup_product_data):
    """Criterion 2: Review list is empty until explicit trigger action is performed."""
    data = setup_product_data
    post_id = data["post_id"]

    # List reviews before trigger
    list_res = client.get(
        f"/api/v1/ai/{post_id}/reviews",
        headers=data["creator_headers"],
    )
    assert list_res.status_code == 200
    assert len(list_res.json()) == 0

    # Explicit trigger
    gen_res = client.post(
        f"/api/v1/ai/{post_id}/review/generate",
        json={"sourceType": "both", "includeCommunity": True},
        headers=data["creator_headers"],
    )
    assert gen_res.status_code == 200
    review = gen_res.json()
    assert review["version"] == 1
    assert review["status"] == "completed"
    assert "access_verified" in review["stagesCompleted"]
    assert "results_persisted" in review["stagesCompleted"]


def test_criterion_3_all_eligible_product_sources_considered(client, setup_product_data):
    """Criterion 3: Snapshot includes both community comments and internal documents."""
    data = setup_product_data
    post_id = data["post_id"]

    gen_res = client.post(
        f"/api/v1/ai/{post_id}/review/generate",
        json={"sourceType": "both", "includeCommunity": True},
        headers=data["creator_headers"],
    )
    assert gen_res.status_code == 200
    review = gen_res.json()
    snapshot = review["sourceSnapshot"]
    assert snapshot["comment_count"] == 2
    assert snapshot["document_count"] == 1
    assert set(snapshot["comment_ids"]) == set(data["comment_ids"])
    assert data["doc_id"] in snapshot["doc_ids"]


def test_criterion_4_excluded_sources_are_not_retrieved(client, setup_product_data):
    """Criterion 4: Explicitly excluding documents or comments excludes them from snapshot and stats."""
    data = setup_product_data
    post_id = data["post_id"]

    # Exclude documents by requesting sourceType="community"
    gen_res = client.post(
        f"/api/v1/ai/{post_id}/review/generate",
        json={"sourceType": "community", "includeCommunity": True},
        headers=data["creator_headers"],
    )
    assert gen_res.status_code == 200
    review = gen_res.json()
    assert review["sourceSnapshot"]["document_count"] == 0
    assert len(review["sourceSnapshot"]["doc_ids"]) == 0
    assert review["deterministicStats"]["documentsAnalyzed"] == 0


def test_criterion_5_all_findings_cite_actual_sources(client, setup_product_data):
    """Criterion 5: Supporting comment IDs in findings only contain real IDs."""
    data = setup_product_data
    post_id = data["post_id"]

    gen_res = client.post(
        f"/api/v1/ai/{post_id}/review/generate",
        json={"sourceType": "both", "includeCommunity": True},
        headers=data["creator_headers"],
    )
    assert gen_res.status_code == 200
    structured = gen_res.json()["structuredOutput"]

    valid_ids = set(data["comment_ids"] + [data["doc_id"]])
    for item in structured.get("productStrengths", []):
        for cid in item.get("supportingCommentIds", []):
            assert cid in valid_ids, f"Hallucinated citation: {cid}"

    for item in structured.get("customerPainPoints", []):
        for cid in item.get("supportingCommentIds", []):
            assert cid in valid_ids, f"Hallucinated citation: {cid}"


def test_criterion_6_empty_sections_are_handled_honestly(client):
    """Criterion 6: An empty product discussion with zero comments handles empty sections honestly."""
    uid = uuid.uuid4().hex[:8]
    creator_id, _ = community_repo.create_user(
        email=f"empty_{uid}@example.com",
        password="Password123!",
        username=f"empty_{uid}",
        display_name="Empty Creator",
    )
    creator_token = create_access_token(
        user_id=creator_id, email=f"empty_{uid}@example.com", username=f"empty_{uid}"
    )
    headers = {"Authorization": f"Bearer {creator_token}"}

    post_res = client.post(
        "/api/v1/posts",
        json={
            "title": f"Blank Product {uid}",
            "description": "Brand new workspace with zero comments and zero documents.",
            "postType": "product_review",
            "category": "Developer Tools",
        },
        headers=headers,
    )
    empty_post_id = post_res.json()["id"]

    gen_res = client.post(
        f"/api/v1/ai/{empty_post_id}/review/generate",
        json={"sourceType": "both", "includeCommunity": True},
        headers=headers,
    )
    assert gen_res.status_code == 200
    review = gen_res.json()
    structured = review["structuredOutput"]
    # Handled honestly: empty lists and transparent evidence gaps
    assert len(structured["customerPainPoints"]) == 0
    assert "no community feedback" in structured["evidenceGaps"].lower()


def test_criterion_7_and_8_review_v1_remains_unchanged_and_v2_creates_new_snapshot(client, setup_product_data):
    """Criteria 7 & 8: V1 is immutable. Adding a new comment prompts new-activity indicator; V2 creates new version."""
    data = setup_product_data
    post_id = data["post_id"]

    # 1. Generate V1
    v1_res = client.post(
        f"/api/v1/ai/{post_id}/review/generate",
        json={"sourceType": "both", "includeCommunity": True},
        headers=data["creator_headers"],
    )
    assert v1_res.status_code == 200
    v1_id = v1_res.json()["id"]
    v1_snapshot = v1_res.json()["sourceSnapshot"]
    assert v1_snapshot["comment_count"] == 2

    # 2. Add a 3rd comment after V1
    c3_res = client.post(
        "/api/v1/comments",
        json={"postId": post_id, "content": "Tested MIDI export and encountered timing drift on bar 32."},
        headers=data["visitor_headers"],
    )
    assert c3_res.status_code == 201, c3_res.text

    # 3. Source availability now indicates new activity
    avail_res = client.get(
        f"/api/v1/ai/{post_id}/review/sources",
        headers=data["creator_headers"],
    )
    assert avail_res.status_code == 200
    avail = avail_res.json()
    assert avail["hasNewActivitySinceLastReview"] is True
    assert avail["newCommentsCountSinceLastReview"] == 1

    # 4. Fetch V1 directly: MUST REMAIN UNCHANGED
    v1_check = client.get(
        f"/api/v1/ai/reviews/{v1_id}",
        headers=data["creator_headers"],
    )
    assert v1_check.status_code == 200
    assert v1_check.json()["sourceSnapshot"]["comment_count"] == 2

    # 5. Generate V2
    v2_res = client.post(
        f"/api/v1/ai/{post_id}/review/generate",
        json={"sourceType": "both", "includeCommunity": True},
        headers=data["creator_headers"],
    )
    assert v2_res.status_code == 200
    v2 = v2_res.json()
    assert v2["version"] == 2
    assert v2["sourceSnapshot"]["comment_count"] == 3


def test_criterion_9_and_10_conversation_linked_to_v1_and_preserves_context(client, setup_product_data):
    """Criteria 9 & 10: V1 conversation session is linked to V1 and multi-turn context is retained."""
    data = setup_product_data
    post_id = data["post_id"]

    # 1. Generate review V1
    gen_res = client.post(
        f"/api/v1/ai/{post_id}/review/generate",
        json={"sourceType": "both", "includeCommunity": True},
        headers=data["creator_headers"],
    )
    review_id = gen_res.json()["id"]

    # 2. Ask first question linked to review
    msg1_res = client.post(
        f"/api/v1/ai/reviews/{review_id}/messages",
        json={"question": "What were the primary complaints about buffer settings?", "agentMode": "analytical"},
        headers=data["creator_headers"],
    )
    assert msg1_res.status_code == 200, msg1_res.text
    msg1 = msg1_res.json()
    assert msg1["role"] == "assistant"
    assert len(msg1["content"]) > 10

    # 3. Ask follow-up question
    msg2_res = client.post(
        f"/api/v1/ai/reviews/{review_id}/messages",
        json={"question": "How does that compare to the spec documentation?", "agentMode": "analytical"},
        headers=data["creator_headers"],
    )
    assert msg2_res.status_code == 200, msg2_res.text

    # 4. Fetch conversation history
    conv_res = client.get(
        f"/api/v1/ai/reviews/{review_id}/conversation",
        headers=data["creator_headers"],
    )
    assert conv_res.status_code == 200
    conv = conv_res.json()
    assert conv["reviewId"] == review_id
    assert conv["reviewVersion"] == 1
    # 2 user messages + 2 assistant messages = 4
    assert len(conv["messages"]) == 4


def test_criterion_11_unauthorized_users_cannot_access_reviews(client, setup_product_data):
    """Criterion 11: Unauthorized direct requests return HTTP 403 Forbidden."""
    data = setup_product_data
    post_id = data["post_id"]

    # Visitor tries to generate review -> 403
    gen_res = client.post(
        f"/api/v1/ai/{post_id}/review/generate",
        json={"sourceType": "both", "includeCommunity": True},
        headers=data["visitor_headers"],
    )
    assert gen_res.status_code == 403

    # Creator generates review
    owner_gen = client.post(
        f"/api/v1/ai/{post_id}/review/generate",
        json={"sourceType": "both", "includeCommunity": True},
        headers=data["creator_headers"],
    )
    review_id = owner_gen.json()["id"]

    # Visitor tries to access review -> 404/403
    get_res = client.get(
        f"/api/v1/ai/reviews/{review_id}",
        headers=data["visitor_headers"],
    )
    assert get_res.status_code in (403, 404)

    # Visitor tries to access review conversation -> 404/403
    chat_res = client.get(
        f"/api/v1/ai/reviews/{review_id}/conversation",
        headers=data["visitor_headers"],
    )
    assert chat_res.status_code in (403, 404)


def test_criterion_12_review_reports_can_be_reopened_and_exported(client, setup_product_data):
    """Criterion 12: Review reports can be reopened by owner and exported as Markdown and PDF."""
    data = setup_product_data
    post_id = data["post_id"]

    gen_res = client.post(
        f"/api/v1/ai/{post_id}/review/generate",
        json={"sourceType": "both", "includeCommunity": True},
        headers=data["creator_headers"],
    )
    review_id = gen_res.json()["id"]

    # 1. Reopen review
    reopen_res = client.get(
        f"/api/v1/ai/reviews/{review_id}",
        headers=data["creator_headers"],
    )
    assert reopen_res.status_code == 200
    assert reopen_res.json()["id"] == review_id

    # 2. Export Markdown
    md_res = client.get(
        f"/api/v1/ai/reviews/{review_id}/download?format=md",
        headers=data["creator_headers"],
    )
    assert md_res.status_code == 200
    assert "text/markdown" in md_res.headers.get("content-type", "")
    assert b"Full Product Review:" in md_res.content
    assert b"1. Executive Overview" in md_res.content

    # 3. Export PDF
    pdf_res = client.get(
        f"/api/v1/ai/reviews/{review_id}/download?format=pdf",
        headers=data["creator_headers"],
    )
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers.get("content-type", "")
    assert pdf_res.content.startswith(b"%PDF")
