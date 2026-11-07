"""RAG Text Normalization and Sanitization Pipeline.

Ensures all input texts (community comments, discussion context) and generated
output texts (LLM answers, observed facts, hypotheses, follow-ups) are completely
sanitized, neatly formatted, and free of unnecessary characters, stray XML/HTML tags,
markdown code fences, broken citations, or duplicate bullet symbols.
"""

from __future__ import annotations

import html
import json
import re
from typing import Any, Dict, List, Optional


# Regular expressions for cleaning
RE_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\ufeff\u200b]")
RE_XML_HTML_TAGS = re.compile(r"</?(?:comment|retrieved_evidence|post_context|validated_themes|community_feedback|recent_conversation|direct_answer|hypotheses|citations|observation|div|span|p|br|script|style)[^>]*>", re.IGNORECASE)
RE_CODE_FENCES = re.compile(r"```(?:json|markdown|text|xml)?|```", re.IGNORECASE)
RE_INLINE_CITATIONS = re.compile(r"\[(?:cite:?|comment:?|ref:?)?\s*([a-zA-Z0-9_-]{8,}|[0-9]+)\]", re.IGNORECASE)
RE_NUMERIC_OR_BULLET_PREFIX = re.compile(r"^(?:(?:[\d]+[\.\)]|\*|\-|\u2022|\u25aa|\u25b8)\s*)+")
RE_EXCESS_WHITESPACE = re.compile(r"[ \t]+")
RE_EXCESS_NEWLINES = re.compile(r"\n{3,}")
RE_ESCAPED_QUOTES = re.compile(r'\\(["\'])')


def clean_input_text(text: Optional[str]) -> str:
    """Sanitizes raw input text (e.g. comments, discussion descriptions) for RAG embedding and prompts.
    
    1. Removes invisible zero-width and control characters.
    2. Decodes HTML entities (&amp; -> &, &quot; -> ", etc.).
    3. Strips raw HTML / malicious script / XML tags.
    4. Normalizes carriage returns and multiple consecutive spaces.
    5. Strips stray surrounding quotes or excessive punctuation.
    """
    if not text:
        return ""

    s = str(text)

    # 1. Strip zero-width & non-printable control characters
    s = RE_CONTROL_CHARS.sub("", s)

    # 2. Decode HTML entities
    s = html.unescape(s)

    # 3. Strip script / style / XML tags
    s = RE_XML_HTML_TAGS.sub("", s)

    # 4. Normalize line endings and whitespace
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = RE_EXCESS_NEWLINES.sub("\n\n", s)
    lines = [RE_EXCESS_WHITESPACE.sub(" ", line).strip() for line in s.split("\n")]
    s = "\n".join(lines).strip()

    return s


def clean_output_text(text: Optional[str], strip_bullet_prefix: bool = False) -> str:
    """Sanitizes LLM generated text for pristine, symbol-free display in UI cards and documents.
    
    1. Strips code fences (```json, ```, etc.).
    2. Strips prompt tags (<direct_answer>, <comment id="...">, etc.).
    3. Strips unparsed bracket citations (e.g. [comment-123], [cite: 1]) so natural sentences flow smoothly.
    4. Fixes escaped characters (e.g. \\" -> ").
    5. Optionally removes duplicate leading bullet/numbering prefixes ('1. ', '- ', '• ').
    6. Trims trailing/leading whitespace cleanly.
    """
    if not text:
        return ""

    s = str(text)

    # 1. Remove code block wrappers
    s = RE_CODE_FENCES.sub("", s)

    # 1b. If raw JSON structure leaked into plain text, attempt to extract relevant value
    if s.strip().startswith("{") and s.strip().endswith("}"):
        try:
            parsed = json.loads(s.strip())
            if isinstance(parsed, dict):
                s = parsed.get("direct_answer") or parsed.get("answer") or parsed.get("summary") or s
        except Exception:
            pass

    # 2. Remove XML/HTML tags that might have leaked from prompt delimiters
    s = RE_XML_HTML_TAGS.sub("", s)

    # 3. Strip inline citation placeholders like [comment-1] or [cite: abc]
    s = RE_INLINE_CITATIONS.sub("", s)

    # 4. Fix escaped quotes and characters
    s = RE_ESCAPED_QUOTES.sub(r"\1", s)
    s = s.replace(r"\n", " ").replace(r"\t", " ")

    # 5. Decode any HTML entities
    s = html.unescape(s)

    # 6. Normalize whitespace
    s = RE_CONTROL_CHARS.sub("", s)
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = RE_EXCESS_NEWLINES.sub("\n\n", s)

    # 7. Optionally strip bullet/numeric prefixes (crucial for items inside lists/arrays)
    if strip_bullet_prefix:
        lines = [RE_NUMERIC_OR_BULLET_PREFIX.sub("", line.strip()).strip() for line in s.split("\n")]
        s = " ".join(l for l in lines if l)
    else:
        lines = [line.strip() for line in s.split("\n")]
        s = "\n".join(lines)

    # Clean multi-spaces
    s = RE_EXCESS_WHITESPACE.sub(" ", s).strip()

    # Ensure clean ending (remove hanging colons or odd trailing brackets)
    if s.endswith(" :"):
        s = s[:-2] + ":"

    return s


def clean_list_items(items: Optional[List[Any]]) -> List[str]:
    """Cleans a list of text strings, removing bullet prefixes, excess spaces, and empty items."""
    if not items:
        return []

    cleaned: List[str] = []
    for item in items:
        if item is None:
            continue
        cleaned_item = clean_output_text(str(item), strip_bullet_prefix=True)
        if cleaned_item and len(cleaned_item) > 1:
            cleaned.append(cleaned_item)

    return cleaned


def sanitize_research_proposal(proposal: Any) -> Any:
    """Sanitizes all text fields within a ResearchAnswerProposal object or dict."""
    if hasattr(proposal, "direct_answer"):
        proposal.direct_answer = clean_output_text(proposal.direct_answer)
        if hasattr(proposal, "executive_summary") and proposal.executive_summary:
            proposal.executive_summary = clean_output_text(proposal.executive_summary)
        if hasattr(proposal, "key_findings") and proposal.key_findings:
            proposal.key_findings = clean_list_items(proposal.key_findings)
        proposal.observed_facts = clean_list_items(proposal.observed_facts)
        proposal.hypotheses_and_interpretations = clean_list_items(proposal.hypotheses_and_interpretations)
        if proposal.limitations_and_uncertainty:
            proposal.limitations_and_uncertainty = clean_output_text(proposal.limitations_and_uncertainty)
        proposal.suggested_follow_ups = clean_list_items(proposal.suggested_follow_ups)
        if hasattr(proposal, "visual_diagram") and proposal.visual_diagram:
            proposal.visual_diagram = clean_output_text(proposal.visual_diagram)
        if hasattr(proposal, "ui_mockup_concept") and proposal.ui_mockup_concept:
            proposal.ui_mockup_concept = clean_output_text(proposal.ui_mockup_concept)
        if hasattr(proposal, "image_prompt") and proposal.image_prompt:
            proposal.image_prompt = clean_output_text(proposal.image_prompt)
        if hasattr(proposal, "cross_source_comparison") and proposal.cross_source_comparison:
            csc = proposal.cross_source_comparison
            if hasattr(csc, "agreement"):
                csc.agreement = clean_list_items(csc.agreement)
                csc.contradiction = clean_list_items(csc.contradiction)
                csc.missingDocumentation = clean_list_items(csc.missingDocumentation) if hasattr(csc, "missingDocumentation") else clean_list_items(getattr(csc, "missing_documentation", []))
                csc.unverifiedAssumptions = clean_list_items(csc.unverifiedAssumptions) if hasattr(csc, "unverifiedAssumptions") else clean_list_items(getattr(csc, "unverified_assumptions", []))
    elif isinstance(proposal, dict):
        proposal["direct_answer"] = clean_output_text(proposal.get("direct_answer", ""))
        if "executive_summary" in proposal:
            proposal["executive_summary"] = clean_output_text(proposal.get("executive_summary", ""))
        if "key_findings" in proposal:
            proposal["key_findings"] = clean_list_items(proposal.get("key_findings", []))
        proposal["observed_facts"] = clean_list_items(proposal.get("observed_facts", []))
        proposal["hypotheses_and_interpretations"] = clean_list_items(proposal.get("hypotheses_and_interpretations", []))
        if proposal.get("limitations_and_uncertainty"):
            proposal["limitations_and_uncertainty"] = clean_output_text(proposal.get("limitations_and_uncertainty", ""))
        proposal["suggested_follow_ups"] = clean_list_items(proposal.get("suggested_follow_ups", []))

    return proposal


def sanitize_gemini_analysis(output: Any) -> Any:
    """Sanitizes all text fields within a GeminiAnalysisOutput object or dict."""
    if hasattr(output, "discussion_summary"):
        output.discussion_summary = clean_output_text(output.discussion_summary)
        for theme in getattr(output, "themes", []):
            if hasattr(theme, "theme_name"):
                theme.theme_name = clean_output_text(theme.theme_name, strip_bullet_prefix=True)
                theme.summary = clean_output_text(theme.summary)
            elif isinstance(theme, dict):
                theme["theme_name"] = clean_output_text(theme.get("theme_name", ""), strip_bullet_prefix=True)
                theme["summary"] = clean_output_text(theme.get("summary", ""))

        for d in getattr(output, "disagreements", []):
            if hasattr(d, "topic"):
                d.topic = clean_output_text(d.topic, strip_bullet_prefix=True)
                d.perspective_a = clean_output_text(d.perspective_a)
                d.perspective_b = clean_output_text(d.perspective_b)
                d.takeaway = clean_output_text(d.takeaway)
            elif isinstance(d, dict):
                d["topic"] = clean_output_text(d.get("topic", ""), strip_bullet_prefix=True)
                d["perspective_a"] = clean_output_text(d.get("perspective_a", ""))
                d["perspective_b"] = clean_output_text(d.get("perspective_b", ""))
                d["takeaway"] = clean_output_text(d.get("takeaway", ""))

        for r in getattr(output, "recommendations", []):
            if hasattr(r, "title"):
                r.title = clean_output_text(r.title, strip_bullet_prefix=True)
                r.problem_addressed = clean_output_text(r.problem_addressed)
                r.rationale = clean_output_text(r.rationale)
                r.suggested_validation = clean_output_text(r.suggested_validation)
            elif isinstance(r, dict):
                r["title"] = clean_output_text(r.get("title", ""), strip_bullet_prefix=True)
                r["problem_addressed"] = clean_output_text(r.get("problem_addressed", ""))
                r["rationale"] = clean_output_text(r.get("rationale", ""))
                r["suggested_validation"] = clean_output_text(r.get("suggested_validation", ""))

        if getattr(output, "limitations_and_uncertainty", None):
            output.limitations_and_uncertainty = clean_output_text(output.limitations_and_uncertainty)

    return output


def clean_evidence_quote(text: Optional[str]) -> str:
    """Strips all markdown formatting, symbols, page delimiters, and code fences from evidence quotes.
    
    Guarantees pure, human-readable prose without raw symbols, hashes, asterisks, brackets, or code fences.
    """
    if not text:
        return ""
    s = str(text)

    # 1. Decode HTML entities first
    s = html.unescape(s)

    # 2. Strip code block fences and backticks
    s = re.sub(r"```[\w]*|```", " ", s)
    s = re.sub(r"`+([^`]+)`+", r"\1", s)
    s = s.replace("`", "")

    # 3. Strip document page markers (--- [Page 1] --- or [Page 2] or Page 1:)
    s = re.sub(r"-{2,}\s*\[Page\s+\d+\]\s*-{2,}", " ", s, flags=re.IGNORECASE)
    s = re.sub(r"\[Page\s+\d+\]", " ", s, flags=re.IGNORECASE)
    s = re.sub(r"\bPage\s+\d+\s*:\s*", " ", s, flags=re.IGNORECASE)

    # 4. Strip markdown links [text](url) -> text
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)

    # 5. Strip inline citation placeholders like [comment-123], [cite: 1], [ref: 45]
    s = RE_INLINE_CITATIONS.sub(" ", s)

    # 6. Strip stray brackets and braces
    s = re.sub(r"[\[\]\{\}]", " ", s)

    # 7. Strip markdown headers (# Heading -> Heading)
    s = re.sub(r"#{1,6}\s*", " ", s)

    # 8. Strip horizontal rules (---, ===, ___)
    s = re.sub(r"-{3,}|={3,}|_{3,}", " ", s)

    # 9. Strip bold and italic delimiters (**bold** -> bold, *italic* -> italic)
    s = re.sub(r"\*\*([^*]+)\*\*", r"\1", s)
    s = re.sub(r"\*([^*]+)\*", r"\1", s)
    s = re.sub(r"__([^_]+)__", r"\1", s)
    s = re.sub(r"_([^_]+)_", r"\1", s)

    # 10. Strip table formatting pipes (| col | col |)
    s = re.sub(r"\|", " ", s)

    # 11. Strip bullet prefixes and symbols (*, -, •, ▪, ▫, ◦, ■, □, ►, ▸, ▶, >, ~, ^)
    s = re.sub(r"[\u2022\u25aa\u25ab\u25e6\u25a0\u25a1\u25ba\u25b8\u25b6\~]", " ", s)
    s = re.sub(r"^\s*[\*\-\+\>\~]\s+", " ", s, flags=re.MULTILINE)

    # 12. Strip any stray asterisks, hashes, backslashes, tildes, carets
    s = re.sub(r"[\*#\\~^]", " ", s)

    # 13. Strip HTML / XML tags
    s = RE_XML_HTML_TAGS.sub(" ", s)

    # 14. Strip non-printable control characters
    s = RE_CONTROL_CHARS.sub("", s)

    # 15. Normalize punctuation and whitespace (collapse duplicate spaces/tabs/newlines)
    s = re.sub(r"\s+", " ", s).strip()

    # 16. Remove awkward dangling punctuation or prefixes like ": " or "- "
    s = re.sub(r"^[\s,;:\-–—\.]+", "", s)
    s = re.sub(r"[\s\-–—]+$", "", s)

    return s.strip()


# Spam, Scam, and Moderation Token Lists
DISALLOWED_SPAM_PATTERNS = [
    re.compile(r"(?:t\.me/|telegram\.me/|wa\.me/|whatsapp\.com/chat/)", re.IGNORECASE),
    re.compile(r"\b(?:crypto\s*airdrop|free\s*crypto|guaranteed\s*100x|pump\s*and\s*dump|buy\s*followers)\b", re.IGNORECASE),
    re.compile(r"\b(?:cialis|viagra|casino\s*online|slot\s*gacor)\b", re.IGNORECASE),
]

TOXIC_TOKENS = [
    "kys", "kill yourself", "die in a hole",
]


def audit_and_moderate_content(text: str) -> tuple[bool, Optional[str], str]:
    """Inspects user reviews and community comments for spam and toxicity.
    
    Returns:
        (is_allowed, rejection_reason, sentiment_category)
    """
    clean_t = (text or "").strip()
    if len(clean_t) < 2:
        return False, "Comment is too short.", "neutral"

    # 1. Check spam patterns
    for p in DISALLOWED_SPAM_PATTERNS:
        if p.search(clean_t):
            return False, "Comment contains prohibited promotional spam links or phrases.", "spam"

    # 2. Check toxic harassment phrases
    lower = clean_t.lower()
    for tok in TOXIC_TOKENS:
        if tok in lower:
            return False, "Comment violates our community code of conduct regarding abusive language.", "toxic"

    # 3. Detect tone / sentiment category
    if any(w in lower for w in ("bug", "crash", "fails", "broken", "error", "defect", "freeze", "infinite loop")):
        sentiment = "bug_report"
    elif any(w in lower for w in ("would love", "feature request", "please add", "suggestion", "could we have", "recommend adding")):
        sentiment = "feature_request"
    elif any(w in lower for w in ("great", "awesome", "impressive", "love this", "excellent", "clean", "superb")):
        sentiment = "praise"
    else:
        sentiment = "constructive"

    return True, None, sentiment


