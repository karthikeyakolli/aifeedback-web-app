# Intellectual Property & License Audit Report

This document delivers a senior legal and architectural review of the intellectual property, copyright, and licensing conditions across the five reference repositories cloned into `references/repositories/`. 

> [!WARNING]
> **Strict Engineering Rule**: Publicly visible source code on GitHub is **not** automatically free to incorporate into a commercial or proprietary application. All team members and autonomous agents must strictly follow the classifications and boundaries set forth below. Under no circumstances should source code, stylesheets, or proprietary assets be copied directly into our platform.

---

## 1. Executive Summary & Classification Matrix

| Repository | Declared License | SPXD Identifier | Code Reuse Permitted in Our App? | Copyleft / Viral Risk | Attribution Requirements | Strategic Classification |
|---|---|---|---|---|---|---|
| **Open-Launch** | Modified MIT with Viral Attribution | Custom / Non-standard | **NO** (Unless willing to display permanent badge) | None (Permissive base), but **strict UI restriction** | **Mandatory 150x44px SVG badge + dofollow link on ALL pages** | **Reference & Study Only**; clean-room reimplementation recommended |
| **Quackback** | GNU Affero General Public License v3.0 | `AGPL-3.0-only` | **STRICTLY PROHIBITED** | **EXTREME (Copyleft Section 13)** | Full source release required over network | **Architectural & Design Study Only**; absolute bar against code borrowing |
| **Fider** | GNU Affero General Public License v3.0 | `AGPL-3.0-only` | **STRICTLY PROHIBITED** | **EXTREME (Copyleft Section 13)** | Full source release required over network | **Architectural & Design Study Only**; absolute bar against code borrowing |
| **Peerlist-Clone** | None (Unlicensed) | `NOASSERTION` | **STRICTLY PROHIBITED** | Not applicable; default copyright applies | None granted | **Study Only**; all rights reserved by author `pruthvii09` |
| **Product-Hunt-API** | None (Starter kit) | `NOASSERTION` | **PROHIBITED** (API patterns permitted) | None | Product Hunt API ToS applies | **Integration Reference Only**; subject to Product Hunt Developer Terms |

---

## 2. In-Depth Repository Legal Analysis

### A. Open-Launch
- **License Text Location**: [`references/repositories/Open-Launch/LICENSE`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Open-Launch/LICENSE)
- **Copyright Owner**: Copyright (c) 2025 Open Launch
- **License Type**: Modified MIT License with Mandatory Attribution Clause.
- **Specific Clauses**:
  1. *Web Application Mandate*: Any online service utilizing or modifying the software **must** display a visible, permanent dofollow link to `https://open-launch.com` on **all pages** of the website.
  2. *Visual Badge Mandate*: Must use official SVG badges (`powered-by-light.svg` or `powered-by-dark.svg`) measuring **at least 150x44 pixels**.
  3. *Prohibition of Nofollow*: Specifically states that `rel="nofollow"` is forbidden. Text-only attribution is explicitly deemed insufficient.
  4. *Enforcement & Termination*: Failure to comply triggers **automatic termination of the license**, exposing the user to immediate copyright infringement claims.
- **Impact on Our Platform**:
  - Incorporating any Open-Launch code or components would legally bind our commercial developer community platform to host a permanent 150x44px third-party badge and SEO-passing dofollow link on every single page.
  - This is unacceptable for an independent developer community.
  - **Verdict**: Treat Open-Launch as a **conceptual architecture reference only**. Reimplement all launch directory schemas, daily leaderboards, and voting logic from scratch using a clean-room approach.

---

### B. Quackback
- **License Text Location**: [`references/repositories/Quackback/LICENSE`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Quackback/LICENSE)
- **Copyright Owner**: Copyright (C) Free Software Foundation / QuackbackIO
- **License Type**: GNU Affero General Public License Version 3 (AGPL-3.0)
- **Specific Clauses (Section 13 - Remote Network Interaction)**:
  > *"Notwithstanding any other provision of this License, if you modify the Program, your modified version must prominently offer all users interacting with it remotely through a computer network [...] an opportunity to receive the Corresponding Source of your version by providing access to the Corresponding Source from a network server at no charge..."*
- **Impact on Our Platform**:
  - The AGPL-3.0 is a strong network copyleft license designed specifically to close the "SaaS loophole" of the GPL.
  - If any code, library, or derivative component from Quackback is integrated into our platform backend or frontend web service, our entire platform codebase could be legally compelled to be released under AGPL-3.0.
  - **Verdict**: **Strict firewall**. Absolutely no copying of source code, components, hooks, or styles. Study only its public API design, schema concepts (such as tri-state moderation, board access scopes, and SLA timers), and UI workflows.

---

### C. Fider
- **License Text Location**: [`references/repositories/Fider/LICENSE`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Fider/LICENSE)
- **Copyright Owner**: Copyright (C) Free Software Foundation / GetFider
- **License Type**: GNU Affero General Public License Version 3 (AGPL-3.0)
- **Impact on Our Platform**:
  - Exactly identical copyleft ramifications to Quackback.
  - Fider contains elegant Go middleware, SQL migration structures, and suggestion status workflows (`open`, `started`, `completed`, `declined`).
  - While these state machines and ideas can be modeled independently in Python/SQL, **zero lines of Go or React code may be ingested**.
  - **Verdict**: **Strict firewall**. Study the simplicity of its single-table tenant isolation and vote tallying logic, but implement our own FastAPI/SQLAlchemy/PostgreSQL models independently.

---

### D. Peerlist-Clone
- **License Text Location**: None exists in the repository.
- **Copyright Owner**: `pruthvii09` (author)
- **License Type**: Unlicensed / All Rights Reserved.
- **Legal Principles**:
  - Under the Berne Convention for the Protection of Literary and Artistic Works and modern international copyright law, the omission of an open-source license does **not** place code in the public domain.
  - All exclusive rights (reproduction, distribution, public display, derivation) remain strictly reserved by the author.
  - The repository was published publicly, granting visitors standard GitHub viewing rights, but conferring no rights for third-party commercial exploitation or code reuse.
- **Verdict**: **Reference only**. Study its Prisma schema for developer profile fields (social links, education, work experience, spotlights) and reimplement cleanly.

---

### E. Product-Hunt-API
- **License Text Location**: None exists in the repository.
- **Copyright Owner**: Product Hunt, Inc.
- **License Type**: Unlicensed example starter for API v2.
- **Legal Principles**:
  - The repository provides a reference implementation for interacting with the official Product Hunt GraphQL API v2.
  - Usage of the API itself is governed by the Product Hunt API Terms of Service and Developer Policy (governing query rates, data caching, attribution, and non-impersonation).
- **Verdict**: **Integration Model Reference**. Use it to understand GraphQL types (`Post`, `Media`, `User`, `Vote`), pagination cursors, and OAuth token exchanges.

---

## 3. Safe Harbor Clean-Room Principles for Our Platform

To ensure our platform operates with complete legal certainty, all developers and AI agents must adhere to the following **Five Clean-Room Rules**:

1. **Idea / Expression Dichotomy**:
   - Copyright protects the *expression* of an idea (the specific lines of code, CSS classes, and component trees), not the *idea* itself (e.g., "allowing users to upvote a prototype", "displaying a public roadmap with three columns", or "providing a 24-hour voting cycle").
   - We extract concepts, schemas, and workflows, and express them independently using our chosen stack (FastAPI, Python 3.11, React 19, Vite, Tailwind).

2. **No Direct Copy-Pasting**:
   - Do not copy-paste code snippets, hooks, utilities, or styling tokens from any of the five repositories.
   - Re-type or generate original solutions based on architectural specifications.

3. **Asset & Trademark Protection**:
   - Never copy SVGs, brand logos, product illustrations, or proprietary imagery from Open-Launch, Quackback, Fider, Peerlist, or Product Hunt.
   - All icons in our platform must come from open-licensed icon libraries (e.g., Lucide React under ISC license).

4. **Independent Schema Construction**:
   - When designing our database models, write our SQLAlchemy schemas according to our unique business requirements (prototype review sessions, deterministic AI analysis, version diffing), rather than importing Prisma or Drizzle definitions.

5. **Attribution Independence**:
   - By writing our code cleanly from scratch, our platform remains free from viral attribution requirements (such as Open-Launch's mandatory footer badge) and can be commercialized or open-sourced under whatever license we choose (such as standard MIT or Apache 2.0).

