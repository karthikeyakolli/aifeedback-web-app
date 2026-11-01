# AI Deliverables & Report Generation Specification

## 1. Overview
The **Deliverables Studio** transforms conversational research, community sentiment clusters, and project documentation into 4 publication-grade deliverables:

1. **Product Requirement Document (PRD)**
2. **Engineering Technical Investigation**
3. **Product Improvement Roadmap**
4. **Analytical Research Report**

All deliverables can be generated on demand, reviewed in a rich preview mode, edited in-place as Markdown, and exported as either Markdown (`.md`) or publication-ready PDF (`.pdf`).

---

## 2. Deliverable Templates & Required Sections

### 1. Product Requirement Document (PRD)
- **Target Audience:** Product managers, designers, engineering leads.
- **Required Sections:**
  1. *Problem Statement & Background* (Context and background).
  2. *User Pain Points & Evidence* (Verified community quotes and friction points).
  3. *Goals & Non-Goals* (Explicit milestone boundaries).
  4. *Proposed Capabilities & Solution Architecture* (User stories and technical design).
  5. *Constraints, Dependencies & Technical Assumptions* (System constraints and risks).
  6. *Open Questions & Future Research* (Unanswered questions before engineering starts).

### 2. Engineering Technical Investigation
- **Target Audience:** Systems architects, backend developers, DevOps engineers.
- **Required Sections:**
  1. *Technical Concerns & Friction Analysis* (User friction in logs and reviews).
  2. *Architectural Impact & Boundary Assessment* (Failure domains, network topology).
  3. *Implementation Feasibility & Prototyping Path* (Feasibility scoring, 3-step prototyping roadmap).
  4. *Security, Access Control & Privacy Constraints* (JWT verification, identity masking, RLS).
  5. *Estimated Complexity & Sprint Sizing* (Developer effort and delivery milestones).

### 3. Product Improvement Roadmap
- **Target Audience:** Founders, stakeholders, development teams.
- **Required Sections:**
  1. *Executive Summary & Strategy Focus* (Overview and feedback volume).
  2. *Short-Term Fixes (P0 / P1 - Immediate Sprint)* (Critical usability blockers).
  3. *Mid-Term Enhancements (P2 - Next Quarter)* (Core retention and workflow additions).
  4. *Long-Term Exploratory Ideas (P3 - Future Roadmap)* (High-leverage differentiators).
  5. *Success Metrics, Telemetry & Evaluation Criteria* (Measurable outcomes).

### 4. Analytical Research Report
- **Target Audience:** Executives, research teams, community leads.
- **Required Sections:**
  1. *Executive Summary & Research Scope* (Sample coverage and scope).
  2. *Methodology & Evidence Grounding* (Sampling and anonymity).
  3. *Evidence Synthesis & Recurring Themes* (Thematic breakdown).
  4. *Direct User Quotes & Grounded Excerpts* (Key evidence citations).
  5. *Research Limitations & Uncertainties* (Sample bias and caveats).

---

## 3. Custom Focus Application

Creators can provide an optional `customFocus` parameter when requesting generation (e.g. *"Focus on onboarding friction"* or *"Investigate WebSocket retry backoff"*).

The service dynamically injects the custom focus into the synthesis engine:
- The custom focus is placed in an executive callout block at the top of the deliverable.
- The thematic weighting algorithm prioritizes suggestions and evidence relevant to the focus topic.

---

## 4. In-Place Editing & Export Workflows

```mermaid
flowchart LR
    Generate[\\"Generate Deliverable\\\"] --> Preview[\\"Rendered Markdown Preview\\\"]
    Preview -->|Edit Toggle| EditMode[\\"In-Place Markdown Editor\\\"]
    EditMode -->|Save Draft| SaveDB[\\"PUT /api/v1/ai/reports/{id} (Version Increment)\\\"]
    SaveDB --> Preview
    Preview -->|Export MD| DownloadMD[\\\"Download .md\\\"]
    Preview -->|Export PDF| DownloadPDF[\\\"Render PDF (FPDF2) & Download .pdf\\\"]
```

### PDF Export Specifications:
- **Renderer:** Python `fpdf2` custom subclass `ReportPDFRenderer`.
- **Layout:** Standard A4 portrait with 20mm margins.
- **Typography:** Helvetica clean typography hierarchy (H1 18pt bold, H2 13pt bold, H3 10.5pt bold, body 9.5pt regular).
- **Styling:** Styled running header (`PRODUCT RESEARCH INTELLIGENCE`), running page footer (`Page X/{nb} | Confidential & Evidence-Grounded Research`), markdown tables with alternating row shading, and blockquotes with left border rules.
- **Character Encoding:** Automatic Latin-1 typography sanitization (smart quotes, em-dashes, and bullet characters mapped to safe equivalents).

