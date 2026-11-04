import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Search,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Quote,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { ChatMessage, Citation } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatTimeAgo } from '../../lib/utils';

export function cleanDisplayProse(text?: string | null): string {
  if (!text) return '';
  return text
    // Strip code fences and backticks
    .replace(/```[\w]*|```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/`/g, '')
    // Strip page tokens like --- [Page 1] --- or [Page 1] or Page 1:
    .replace(/-{2,}\s*\[Page\s+\d+\]\s*-{2,}/gi, ' ')
    .replace(/\[Page\s+\d+\]/gi, ' ')
    .replace(/\bPage\s+\d+\s*:\s*/gi, ' ')
    // Strip markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Strip bracket citations [cite: 1], [comment-123], [1]
    .replace(/\[(?:cite:?|comment:?|ref:?)?\s*[a-zA-Z0-9_-]+\]/gi, ' ')
    // Strip stray brackets and braces
    .replace(/[\[\]\{\}]/g, ' ')
    // Strip markdown headers (# Heading -> Heading)
    .replace(/#{1,6}\s*/g, ' ')
    // Strip horizontal rules
    .replace(/-{3,}|={3,}|_{3,}/g, ' ')
    // Strip bold/italic formatting
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Strip table pipes
    .replace(/\|/g, ' ')
    // Strip bullet symbols
    .replace(/[\u2022\u25aa\u25ab\u25e6\u25a0\u25a1\u25ba\u25b8\u25b6\~]/g, ' ')
    .replace(/^\s*[\*\-\+\>\~]\s+/gm, ' ')
    // Strip stray asterisks, hashes, backslashes, carets
    .replace(/[\*#\\~^]/g, ' ')
    // Strip HTML/XML tags
    .replace(/<\/?[a-zA-Z0-9_-]+[^>]*>/g, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    // Clean dangling prefixes/suffixes
    .replace(/^[\s,;:\-–—\.]+/, '')
    .replace(/[\s\-–—]+$/, '')
    .trim();
}

interface ChatGPTMessageProps {
  message: ChatMessage;
  onCitationClick?: (citation: Citation | string) => void;
  onOpenSources?: () => void;
}

export const ChatGPTMessage: React.FC<ChatGPTMessageProps> = ({
  message,
  onCitationClick,
  onOpenSources,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);
  const [hoveredCitation, setHoveredCitation] = useState<Citation | null>(null);

  const handleCopy = () => {
    // Copy markdown text
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const metadata = message.metadata || {};
  const hasStructuredInsights =
    (metadata.observed_facts && metadata.observed_facts.length > 0) ||
    (metadata.hypotheses && metadata.hypotheses.length > 0) ||
    (metadata.recommendations && metadata.recommendations.length > 0) ||
    Boolean(metadata.limitations) ||
    Boolean(metadata.visual_diagram);

  // User message rendering
  if (isUser) {
    return (
      <div className="flex justify-end my-3">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-indigo-600 text-white shadow-xs px-4 py-3 text-[13px] leading-relaxed">
          <p className="whitespace-pre-wrap">{message.content}</p>
          <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] text-indigo-200">
            <span>{formatTimeAgo(message.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message rendering (ChatGPT Answer Style)
  return (
    <div className="my-5 group relative">
      {/* Assistant Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            AI Research Analyst
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-medium border border-indigo-500/20">
            Gemini 3.8 Flash
          </span>
        </div>
        <span className="text-[11px] text-[var(--text-muted)]">
          {formatTimeAgo(message.createdAt)}
        </span>
      </div>

      {/* Answer Body Canvas */}
      <div className="pl-8 space-y-4">
        {/* Render main text with rich ChatGPT Markdown */}
        <MarkdownRenderer
          content={message.content}
          onCitationClick={(tag) => {
            // Find citation in message citations if available
            const matchingCitation = message.citations?.find(
              (c) =>
                c.commentId.includes(tag) ||
                (c.authorDisplay && c.authorDisplay.toLowerCase().includes(tag.toLowerCase()))
            );
            if (matchingCitation) {
              onCitationClick?.(matchingCitation);
            } else {
              onCitationClick?.(tag);
            }
          }}
        />

        {/* Structured Evidence & Synthesis Accordion (ChatGPT Canvas Style) */}
        {hasStructuredInsights && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] overflow-hidden shadow-xs mt-3">
            <button
              type="button"
              onClick={() => setShowEvidenceDrawer(!showEvidenceDrawer)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-indigo-500" />
                <span>Grounded Evidence & Deep-Dive Analysis</span>
                {message.citations && message.citations.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    {message.citations.length} cited sources
                  </span>
                )}
              </div>
              {showEvidenceDrawer ? (
                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>

            {showEvidenceDrawer && (
              <div className="p-3.5 space-y-3.5 border-t border-[var(--border-subtle)] text-xs">
                {/* 1. Verified Facts / Community Evidence */}
                {metadata.observed_facts && metadata.observed_facts.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Quote className="w-3 h-3" />
                      Original Community Evidence
                    </span>
                    <ul className="space-y-1 pl-1">
                      {metadata.observed_facts.map((fact: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-[var(--text-primary)]">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{cleanDisplayProse(fact)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 2. Hypotheses / Strategic Interpretation */}
                {metadata.hypotheses && metadata.hypotheses.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3" />
                      Strategic Interpretation & Root Cause
                    </span>
                    <ul className="space-y-1 pl-1">
                      {metadata.hypotheses.map((hyp: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-[var(--text-primary)]">
                          <span className="text-indigo-500 font-bold">•</span>
                          <span>{cleanDisplayProse(hyp)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. Recommended Actions */}
                {metadata.recommendations && metadata.recommendations.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Recommended Product Actions
                    </span>
                    <div className="grid gap-2">
                      {metadata.recommendations.map((r: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[var(--text-primary)]"
                        >
                          <div className="font-semibold text-xs flex items-center justify-between">
                            <span>{cleanDisplayProse(r.action)}</span>
                            {r.impact && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono">
                                {cleanDisplayProse(r.impact)}
                              </span>
                            )}
                          </div>
                          {r.reason && (
                            <p className="text-[11px] text-[var(--text-muted)] mt-1">
                              {cleanDisplayProse(r.reason)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Retrieved & Cited Source Evidence Details */}
                {message.citations && message.citations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />
                      Retrieved & Verified Source Evidence
                    </span>
                    <div className="space-y-2">
                      {message.citations.map((c, idx) => (
                        <div
                          key={c.commentId || idx}
                          onClick={() => onCitationClick?.(c)}
                          className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] hover:border-indigo-500/50 transition-all cursor-pointer shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {c.sourceType === 'document' ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <FileText className="w-2.5 h-2.5" />
                                  Specification Document
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <User className="w-2.5 h-2.5" />
                                  Community Contributor
                                </span>
                              )}
                              <span className="font-semibold text-xs text-[var(--text-primary)]">
                                {cleanDisplayProse(c.authorDisplay) || (c.sourceType === 'document' ? 'Specification Document' : 'Contributor')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {c.pageNumber && (
                                <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--surface-subtle)] px-1.5 py-0.5 rounded">
                                  Page {c.pageNumber}
                                </span>
                              )}
                              {c.section && (
                                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 max-w-40 truncate">
                                  {cleanDisplayProse(c.section)}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                            "{cleanDisplayProse(c.quoteSnippet)}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Visual Architecture Flow */}
                {metadata.visual_diagram && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      Architecture Flow & Diagram
                    </span>
                    <div className="p-3 rounded-lg bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800">
                      <pre>{metadata.visual_diagram}</pre>
                    </div>
                  </div>
                )}

                {/* 6. Limitations & Missing Data */}
                {metadata.limitations && (
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-[11px] text-[var(--text-muted)] flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[var(--text-primary)] font-semibold">Evidence Boundaries: </strong>
                      {cleanDisplayProse(metadata.limitations)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Inline Citation Chips Tray with Interactive Hover Cards */}
        {message.citations && message.citations.length > 0 && (
          <div className="relative pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[var(--text-muted)] font-medium mr-1">
                Sources referenced:
              </span>
              {message.citations.map((c, idx) => (
                <div
                  key={c.commentId || idx}
                  className="relative inline-block"
                  onMouseEnter={() => setHoveredCitation(c)}
                  onMouseLeave={() => setHoveredCitation(null)}
                >
                  <button
                    type="button"
                    onClick={() => onCitationClick?.(c)}
                    className="flex items-center gap-1 px-2 py-0.8 rounded-md text-[11px] font-medium bg-[var(--surface-subtle)] border border-[var(--border-subtle)] hover:border-indigo-500 text-[var(--text-primary)] hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
                  >
                    {c.sourceType === 'document' ? (
                      <FileText className="w-3 h-3 text-blue-500" />
                    ) : (
                      <User className="w-3 h-3 text-emerald-500" />
                    )}
                    <span>{cleanDisplayProse(c.authorDisplay) || c.commentId.slice(0, 8)}</span>
                  </button>

                  {/* Micro-Inspector Hover Card */}
                  {hoveredCitation?.commentId === c.commentId && (
                    <div className="absolute left-0 bottom-full mb-2 w-72 p-3 rounded-xl bg-[var(--surface)] border border-indigo-500/30 shadow-xl z-30 text-xs animate-in fade-in zoom-in-95 duration-100 pointer-events-none">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--border-subtle)]">
                        <span className="font-bold text-[11px] text-[var(--text-primary)] truncate">
                          {cleanDisplayProse(c.authorDisplay) || 'Verified Source'}
                        </span>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {c.sourceType || 'comment'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] italic line-clamp-3 leading-relaxed">
                        "{cleanDisplayProse(c.quoteSnippet)}"
                      </p>
                      <div className="flex items-center justify-between pt-1.5 mt-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                        <span>Click to open in Studio</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ChatGPT Actions Footer */}
        <div className="flex items-center gap-2 pt-2 text-xs text-[var(--text-muted)]">
          {/* Copy response */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Copy answer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] text-emerald-500 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>

          {/* Feedback: Thumbs Up / Down */}
          <button
            type="button"
            onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
            className={`p-1 rounded-md hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer ${
              feedback === 'up' ? 'text-emerald-500' : 'hover:text-[var(--text-primary)]'
            }`}
            title="Helpful response"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
            className={`p-1 rounded-md hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer ${
              feedback === 'down' ? 'text-rose-500' : 'hover:text-[var(--text-primary)]'
            }`}
            title="Unhelpful response"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>

          {/* Jump to sources panel */}
          {onOpenSources && (
            <button
              type="button"
              onClick={onOpenSources}
              className="text-[11px] hover:text-indigo-600 dark:hover:text-indigo-400 ml-auto font-medium transition-colors cursor-pointer"
            >
              Inspect all sources &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
