# AI Input & Output Schema Specification

## 1. Overview
This document specifies the complete request and response schemas governing all AI research interactions across FastAPI, Pydantic, and TypeScript. All fields support both camelCase (frontend convention) and snake_case (Python convention) via Pydantic `AliasChoices`.

---

## 2. Pydantic Schemas (Backend Contract)

### `ChatMessageRequest`
Payload sent by the creator to initiate a research query turn:
```python
class ChatMessageRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="User's research query")
    includedDocIds: Optional[List[str]] = Field(
        default=None,
        validation_alias=AliasChoices("includedDocIds", "included_doc_ids"),
        description="IDs of attached project documents to include in retrieval",
    )
    includeCommunity: bool = Field(
        default=True,
        validation_alias=AliasChoices("includeCommunity", "include_community"),
        description="Whether to include public community feedback in retrieval",
    )
    sourceType: str = Field(
        default="both",
        validation_alias=AliasChoices("sourceType", "source_type"),
        description="Target evidence pool: 'both' | 'community' | 'documents'",
    )
```

### `CrossSourceComparison`
Structured comparison between external feedback and internal documentation:
```python
class CrossSourceComparison(BaseModel):
    agreement: List[str] = Field(default_factory=list, description="Points where feedback and docs agree")
    contradiction: List[str] = Field(default_factory=list, description="Contradictions between feedback and specs")
    missingDocumentation: List[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("missingDocumentation", "missing_documentation"),
        description="User concerns not addressed in uploaded documentation",
    )
    unverifiedAssumptions: List[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("unverifiedAssumptions", "unverified_assumptions"),
        description="Assumptions in specs unverified by customer feedback",
    )
```

### `StructuredRecommendation`
Evidence-grounded action proposal:
```python
class StructuredRecommendation(BaseModel):
    action: str = Field(..., description="Concrete product action proposed")
    reason: str = Field(..., description="Root cause or justification")
    evidence: str = Field(..., description="Supporting comment IDs or doc references")
    applicability: str = Field("core", description="Scope of applicability (e.g. all users, enterprise, mobile)")
    suggestedSuccessMeasure: str = Field(
        ...,
        validation_alias=AliasChoices("suggestedSuccessMeasure", "suggested_success_measure"),
        description="Measurable metric or validation check",
    )
    missingInformation: str = Field(
        "",
        validation_alias=AliasChoices("missingInformation", "missing_information"),
        description="Gaps in knowledge or unconfirmed details",
    )
```

### `ResearchAnswerResponse`
The full validated research response returned to the frontend:
```python
class ResearchAnswerResponse(BaseModel):
    userMessage: ChatMessageResponse
    assistantMessage: ChatMessageResponse
    directAnswer: str
    executiveSummary: str
    keyFindings: List[str]
    observedFacts: List[str]
    hypotheses: List[str]
    crossSourceComparison: Optional[CrossSourceComparison]
    recommendations: List[StructuredRecommendation]
    limitations: str
    suggestedFollowUps: List[str]
    hasSufficientEvidence: bool
    communityEvidence: List[CitationRecord]
    documentEvidence: List[CitationRecord]
    stagesCompleted: List[str]
    deterministicMetrics: Dict[str, Any]
```

---

## 3. Example Request & Response Payloads

### Example Request (`POST /api/v1/ai/chat/sessions/{id}/messages`)
```json
{
  "question": "What are the main connection bottlenecks and how do they compare with our PRD spec?",
  "sourceType": "both",
  "includedDocIds": ["doc_reflect_whitepaper_01"],
  "includeCommunity": true
}
```

### Example Response (`HTTP 200 OK`)
```json
{
  "userMessage": {
    "id": "msg_001",
    "sessionId": "cs_f8f64b39f548",
    "role": "user",
    "content": "What are the main connection bottlenecks and how do they compare with our PRD spec?",
    "citations": [],
    "metadata": {
      "resolved_query": "What are the main connection bottlenecks and how do they compare with our PRD spec?"
    },
    "createdAt": "2026-10-31T23:50:00Z"
  },
  "assistantMessage": {
    "id": "msg_002",
    "sessionId": "cs_f8f64b39f548",
    "role": "assistant",
    "content": "Reviewers identified repeated socket dropouts during network transitions, which contradicts Section 4 of the uploaded PRD assuming seamless handover.",
    "citations": [
      {
        "commentId": "cmt_003",
        "quoteSnippet": "WebSocket connection dropped three times during client testing...",
        "authorDisplay": "Daniel Thorne",
        "sourceType": "comment"
      },
      {
        "commentId": "doc_reflect_whitepaper_01_p2",
        "quoteSnippet": "The synchronization layer guarantees instantaneous zero-drop state sync across all clients...",
        "authorDisplay": "Doc: reflect_whitepaper_v2.pdf",
        "sourceType": "document",
        "filename": "reflect_whitepaper_v2.pdf",
        "pageNumber": 2,
        "section": "Architecture"
      }
    ],
    "metadata": {
      "executive_summary": "Community feedback reveals high satisfaction with latency, but critical friction on connection resilience during handover.",
      "key_findings": [
        "WebSocket drops reported during network handovers.",
        "Internal specification assumes zero-drop state synchronization."
      ]
    },
    "createdAt": "2026-10-31T23:50:02Z"
  },
  "directAnswer": "Reviewers identified repeated socket dropouts during network transitions, which contradicts Section 4 of the uploaded PRD assuming seamless handover.",
  "executiveSummary": "Community feedback reveals high satisfaction with latency, but critical friction on connection resilience during handover.",
  "keyFindings": [
    "WebSocket drops reported during network handovers.",
    "Internal specification assumes zero-drop state synchronization."
  ],
  "observedFacts": [
    "Reviewer observed: 'WebSocket connection dropped three times during client testing...'"
  ],
  "hypotheses": [
    "Connection drops are caused by missing keepalive pings during cellular-to-WiFi handover."
  ],
  "crossSourceComparison": {
    "agreement": [
      "Both feedback and docs agree that baseline transmission latency is under 15ms."
    ],
    "contradiction": [
      "PRD states zero-drop client reconnect, while users report full socket drops."
    ],
    "missingDocumentation": [
      "No client-side retry or exponential backoff parameters documented."
    ],
    "unverifiedAssumptions": [
      "Assumed all client runtimes support automated TCP socket resurrection."
    ]
  },
  "recommendations": [
    {
      "action": "Implement exponential backoff reconnect logic in client SDK",
      "reason": "Prevents socket resets during cellular handover",
      "evidence": "cmt_003",
      "applicability": "all developers",
      "suggestedSuccessMeasure": "Zero dropped state events in reconnect benchmarks",
      "missingInformation": "Target mobile operating system versions"
    }
  ],
  "limitations": "Synthesis is grounded in 4 verified comments and 2 attached project documents.",
  "suggestedFollowUps": [
    "What specific error codes were reported on disconnect?",
    "Generate an engineering technical investigation ticket for reconnect backoff."
  ],
  "hasSufficientEvidence": true,
  "communityEvidence": [
    {
      "commentId": "cmt_003",
      "quoteSnippet": "WebSocket connection dropped three times during client testing...",
      "authorDisplay": "Daniel Thorne",
      "sourceType": "comment"
    }
  ],
  "documentEvidence": [
    {
      "commentId": "doc_reflect_whitepaper_01_p2",
      "quoteSnippet": "The synchronization layer guarantees instantaneous zero-drop state sync across all clients...",
      "authorDisplay": "Doc: reflect_whitepaper_v2.pdf",
      "sourceType": "document",
      "filename": "reflect_whitepaper_v2.pdf",
      "pageNumber": 2,
      "section": "Architecture"
    }
  ],
  "stagesCompleted": [
    "1. Ownership validation",
    "2. Context collection",
    "3. Comment collection",
    "4. Document retrieval",
    "5. Query interpretation",
    "6. Reference resolution",
    "7. BM25 retrieval",
    "8. Evidence ranking",
    "9. Context assembly",
    "10. Gemini generation",
    "11. Groq fallback",
    "12. Structured validation",
    "13. Citation verification",
    "14. Session persistence",
    "15. UI presentation"
  ],
  "deterministicMetrics": {
    "totalCommentsInPost": 4,
    "totalAttachedDocuments": 2,
    "retrievedEvidenceCount": 2,
    "citedCommentsCount": 1,
    "citedDocumentsCount": 1,
    "sourceTypeUsed": "both"
  }
}
```

