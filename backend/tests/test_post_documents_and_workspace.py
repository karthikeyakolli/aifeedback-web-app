import io
import uuid
import pytest
from fpdf import FPDF
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.auth_service import create_access_token
from backend.app.services.retrieval_service import retrieve_evidence
from backend.app.db.repository import community_repo


@pytest.fixture
def client():
    return TestClient(app)


def test_creator_studio_privacy_documents_and_page_preservation(client):
    uid = uuid.uuid4().hex[:8]

    # 1. Create Verified Post Creator (Author)
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

    # 2. Create Normal Visitor (Unauthorized)
    visitor_id, _ = community_repo.create_user(
        email=f"visitor_{uid}@example.com",
        password="Password123!",
        username=f"visitor_{uid}",
        display_name="Visitor User",
    )
    visitor_token = create_access_token(
        user_id=visitor_id, email=f"visitor_{uid}@example.com", username=f"visitor_{uid}"
    )
    visitor_headers = {"Authorization": f"Bearer {visitor_token}"}

    # 3. Create Moderator who is NOT the post creator
    mod_id, _ = community_repo.create_user(
        email=f"mod_{uid}@example.com",
        password="Password123!",
        username=f"mod_{uid}",
        display_name="Community Mod",
    )
    with community_repo.db.session() as conn:
        conn.execute("UPDATE profiles SET is_moderator = 1 WHERE id = ?", (mod_id,))
    mod_token = create_access_token(
        user_id=mod_id, email=f"mod_{uid}@example.com", username=f"mod_{uid}"
    )
    mod_headers = {"Authorization": f"Bearer {mod_token}"}

    # 4. Creator Publishes a Post
    post_res = client.post(
        "/api/v1/posts",
        json={
            "title": "QuantumDB: Next-gen Distributed Engine",
            "description": "Seeking feedback on our new distributed transaction architecture.",
            "postType": "product_review",
            "category": "Developer Tools",
            "tags": ["Database", "Distributed Systems"],
        },
        headers=creator_headers,
    )
    assert post_res.status_code == 201
    post_id = post_res.json()["id"]

    # 5. Access and Privacy Tests:
    # 5a. Unauthorized Visitor attempts to list docs -> 403 Forbidden
    visitor_list = client.get(f"/api/v1/posts/{post_id}/documents", headers=visitor_headers)
    assert visitor_list.status_code == 403

    # 5b. Non-author Moderator attempts to list private documents -> 403 Forbidden
    # (Per Phase 3: Moderator access must NOT automatically expose private documents or strategic research)
    mod_list = client.get(f"/api/v1/posts/{post_id}/documents", headers=mod_headers)
    assert mod_list.status_code == 403
    assert "Only the verified project owner can access private studio documents" in mod_list.json()["detail"]

    # 5c. Non-author Moderator attempts to upload to creator studio -> 403 Forbidden
    mod_upload = client.post(
        f"/api/v1/posts/{post_id}/documents",
        files={"file": ("spec.md", b"# Mod Spec\nSome confidential spec text.", "text/markdown")},
        headers=mod_headers,
    )
    assert mod_upload.status_code == 403

    # 6. Creator uploads project specification (Markdown)
    spec_content = (
        "# QuantumDB Architecture Spec\n\n"
        "## Storage Engine\n"
        "The storage layer employs an immutable LSM-tree with Raft consensus.\n\n"
        "## Performance Targets\n"
        "Latency guarantee is p99 under 5 milliseconds for key-value lookups."
    ).encode("utf-8")

    upload_md_res = client.post(
        f"/api/v1/posts/{post_id}/documents",
        files={"file": ("quantumdb_spec.md", spec_content, "text/markdown")},
        headers=creator_headers,
    )
    assert upload_md_res.status_code == 201
    md_doc = upload_md_res.json()
    assert md_doc["filename"] == "quantumdb_spec.md"
    assert md_doc["fileType"] == "markdown"
    md_doc_id = md_doc["id"]

    # 7. Creator uploads a genuine 2-page PDF document
    fpdf = FPDF()
    fpdf.add_page()
    fpdf.set_font("helvetica", size=12)
    fpdf.cell(text="QuantumDB PDF Page One: Distributed consensus protocol details.")
    fpdf.add_page()
    fpdf.set_font("helvetica", size=12)
    fpdf.cell(text="QuantumDB PDF Page Two: Fault tolerance with Byzantine agreement.")
    pdf_bytes = bytes(fpdf.output())

    upload_pdf_res = client.post(
        f"/api/v1/posts/{post_id}/documents",
        files={"file": ("quantumdb_whitepaper.pdf", pdf_bytes, "application/pdf")},
        headers=creator_headers,
    )
    assert upload_pdf_res.status_code == 201
    pdf_doc = upload_pdf_res.json()
    assert pdf_doc["filename"] == "quantumdb_whitepaper.pdf"
    assert pdf_doc["fileType"] == "pdf"
    pdf_doc_id = pdf_doc["id"]

    # 8. Creator gets document details with extracted content preview
    preview_res = client.get(
        f"/api/v1/posts/{post_id}/documents/{pdf_doc_id}",
        headers=creator_headers,
    )
    assert preview_res.status_code == 200
    preview_data = preview_res.json()
    assert "--- [Page 1] ---" in preview_data["contentText"]
    assert "--- [Page 2] ---" in preview_data["contentText"]
    assert "Byzantine agreement" in preview_data["contentText"]

    # Visitor cannot preview creator's document -> 403
    unauth_prev = client.get(
        f"/api/v1/posts/{post_id}/documents/{pdf_doc_id}",
        headers=visitor_headers,
    )
    assert unauth_prev.status_code == 403

    # 9. Test Retrieval Engine with PDF Page Preservation & Markdown Sections
    post_dict = {"id": post_id, "title": "QuantumDB", "description": "LSM database", "category": "Developer Tools"}

    # Query matching PDF Page 2
    retrieval_pdf = retrieve_evidence(
        post=post_dict,
        comments=[],
        question="What fault tolerance protocol is used?",
    )
    assert len(retrieval_pdf["retrieved_comments"]) > 0
    top_chunk = retrieval_pdf["retrieved_comments"][0]
    assert top_chunk["sourceType"] == "document"
    assert top_chunk["pageNumber"] == 2  # Genuine page 2, not fabricated!
    assert "Byzantine agreement" in top_chunk["content"]

    # Query matching Markdown document section
    retrieval_md = retrieve_evidence(
        post=post_dict,
        comments=[],
        question="What is the p99 latency target?",
    )
    assert len(retrieval_md["retrieved_comments"]) > 0
    top_md = retrieval_md["retrieved_comments"][0]
    assert top_md["sourceType"] == "document"
    assert top_md["pageNumber"] is None  # Markdown has no fabricated page number!
    assert "Performance Targets" in (top_md.get("section") or "") or "latency guarantee" in top_md["content"].lower()

    # 10. Inclusion / Exclusion Source Selection Toggle
    # Query specifying only the MD doc ID (excluding the PDF)
    retrieval_filtered = retrieve_evidence(
        post=post_dict,
        comments=[],
        question="Byzantine agreement",
        included_doc_ids=[md_doc_id],
    )
    # Since PDF was excluded, Byzantine agreement from PDF must NOT be in the results
    assert not any("byzantine" in c["content"].lower() for c in retrieval_filtered["retrieved_comments"])

    # 11. Safe Deletion: Non-author cannot delete -> 403
    del_unauth = client.delete(
        f"/api/v1/posts/{post_id}/documents/{pdf_doc_id}",
        headers=visitor_headers,
    )
    assert del_unauth.status_code == 403

    # Non-author Moderator cannot delete creator's document -> 403
    del_mod = client.delete(
        f"/api/v1/posts/{post_id}/documents/{pdf_doc_id}",
        headers=mod_headers,
    )
    assert del_mod.status_code == 403

    # Creator deletes PDF document -> 204 No Content
    del_res = client.delete(
        f"/api/v1/posts/{post_id}/documents/{pdf_doc_id}",
        headers=creator_headers,
    )
    assert del_res.status_code == 204

    # Document list now only has the Markdown doc
    remaining = client.get(f"/api/v1/posts/{post_id}/documents", headers=creator_headers).json()
    assert len(remaining) == 1
    assert remaining[0]["id"] == md_doc_id
