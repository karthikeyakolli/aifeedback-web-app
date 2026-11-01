import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Zap,
  Quote,
  ExternalLink,
} from 'lucide-react';
import type { ProductReview, Citation } from '../../types';
import { formatTimeAgo } from '../../lib/utils';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface NotebookStudioRailProps {
  selectedReview: ProductReview | null;
  reviewsList: ProductReview[];
  onSelectReview: (review: ProductReview) => void;
  onTriggerNewReview: () => void;
  onExport: (format: 'md' | 'pdf') => void;
  isExporting: 'md' | 'pdf' | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hasNewActivity?: boolean;
  newActivityText?: string;
  inspectedCitation?: Citation | null;
  onCloseInspectedCitation?: () => void;
  onJumpToComment?: (commentId: string) => void;
}

type StudioTab = 'full-review' | 'briefing-notes' | 'source-inspector';

export const NotebookStudioRail: React.FC<NotebookStudioRailProps> = ({
  selectedReview,
  reviewsList,
  onSelectReview,
  onTriggerNewReview,
  onExport,
  isExporting,
  isCollapsed,
  onToggleCollapse,
  hasNewActivity,
  newActivityText,
  inspectedCitation,
  onCloseInspectedCitation,
  onJumpToComment,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('full-review');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Switch to inspector tab when a citation is selected
  React.useEffect(() => {
    if (inspectedCitation) {
      setActiveTab('source-inspector');
    }
  }, [inspectedCitation]);

  // Collapsed Minimal Strip
  if (isCollapsed) {
    return (
      <div className="w-12 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--surface-subtle)]/70 flex flex-col items-center py-4 space-y-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title="Expand Studio Rail"
        >
          <ChevronLeft className="w-4 h-4 text-indigo-500" />
        </button>

        <div className="flex flex-col items-center gap-1">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-[10px] font-bold font-mono text-indigo-600 dark:text-indigo-400">
            V{selectedReview?.version || 1}
          </span>
        </div>

        {hasNewActivity && (
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="New activity available" />
        )}
      </div>
    );
  }

  const structured = selectedReview?.structuredOutput;
  const stats = selectedReview?.deterministicStats;

  return (
    <div
      className={`border-l border-[var(--border-subtle)] bg-[var(--surface)] flex flex-col h-full transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl border'
          : 'w-96 lg:w-[460px] shrink-0'
      }`}
    >
      {/* Studio Header */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] space-y-2 bg-[var(--surface)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Studio Guide
            </h3>
            {selectedReview && (
              <Badge variant="outline" className="px-1.5 py-0.2 text-[10px] font-mono border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                Review V{selectedReview.version}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Version Switcher */}
            {reviewsList.length > 1 && (
              <div className="relative">
                <select
                  aria-label="Select review version"
                  value={selectedReview?.id || ''}
                  onChange={(e) => {
                    const target = reviewsList.find((r) => r.id === e.target.value);
                    if (target) onSelectReview(target);
                  }}
                  className="text-[11px] font-medium bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-2 py-1 pr-6 appearance-none focus:outline-none cursor-pointer"
                >
                  {reviewsList.map((r) => (
                    <option key={r.id} value={r.id}>
                      V{r.version} ({formatTimeAgo(r.createdAt)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[var(--text-muted)] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Export Buttons */}
            {selectedReview && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onExport('md')}
                  disabled={isExporting !== null}
                  className="px-2 py-1 rounded-md text-[11px] font-mono font-medium hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  title="Export Markdown"
                >
                  MD
                </button>
                <button
                  type="button"
                  onClick={() => onExport('pdf')}
                  disabled={isExporting !== null}
                  className="px-2 py-1 rounded-md text-[11px] font-mono font-medium hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  title="Export PDF"
                >
                  PDF
                </button>
              </div>
            )}

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Studio'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Collapse toggle */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Collapse Studio Rail"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Fresh Activity Banner & Generate Button */}
        <div className="flex items-center justify-between gap-2">
          {hasNewActivity && newActivityText ? (
            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span className="truncate">{newActivityText}</span>
            </div>
          ) : (
            <span className="text-[11px] text-[var(--text-muted)]">
              {selectedReview
                ? `Generated ${formatTimeAgo(selectedReview.createdAt)}`
                : 'No review generated yet'}
            </span>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={onTriggerNewReview}
            className="text-[11px] h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-2xs"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {selectedReview ? `New Review V${selectedReview.version + 1}` : 'Generate Review'}
          </Button>
        </div>

        {/* Studio Sub-Tabs */}
        <div className="flex items-center gap-1 pt-1 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setActiveTab('full-review')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'full-review'
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            13-Section Review
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('briefing-notes')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'briefing-notes'
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Studio Notes
          </button>
          {inspectedCitation && (
            <button
              type="button"
              onClick={() => setActiveTab('source-inspector')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'source-inspector'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Evidence Inspector
            </button>
          )}
        </div>
      </div>

      {/* Studio Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!selectedReview ? (
          <div className="p-8 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
            <h4 className="text-xs font-bold text-[var(--text-primary)]">
              No Product Review Available
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto">
              Click "Generate Review" to analyze all community comments and attached specs.
            </p>
            <Button size="sm" variant="primary" onClick={onTriggerNewReview} className="text-xs">
              Generate Review V1
            </Button>
          </div>
        ) : activeTab === 'source-inspector' && inspectedCitation ? (
          /* Source Inspector View */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-1.5">
                <Quote className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Cited Source Excerpt
                </span>
              </div>
              {onCloseInspectedCitation && (
                <button
                  type="button"
                  onClick={onCloseInspectedCitation}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Close
                </button>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-[var(--text-primary)] italic leading-relaxed">
              "{inspectedCitation.quoteSnippet}"
            </div>

            <div className="space-y-2 text-xs text-[var(--text-muted)]">
              <div className="flex items-center justify-between">
                <span>Source Type:</span>
                <span className="font-semibold text-[var(--text-primary)] capitalize">
                  {inspectedCitation.sourceType || 'Community Comment'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Attribution:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {inspectedCitation.authorDisplay || inspectedCitation.commentId}
                </span>
              </div>
              {inspectedCitation.filename && (
                <div className="flex items-center justify-between">
                  <span>File:</span>
                  <span className="font-semibold text-[var(--text-primary)] font-mono text-[11px]">
                    {inspectedCitation.filename}
                  </span>
                </div>
              )}
            </div>

            {onJumpToComment && inspectedCitation.sourceType === 'comment' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onJumpToComment(inspectedCitation.commentId)}
                className="w-full text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Jump to Comment in Community Thread
              </Button>
            )}
          </div>
        ) : activeTab === 'briefing-notes' && structured ? (
          /* NotebookLM Studio Notes View */
          <div className="space-y-3 text-xs">
            {/* Note Card 1: Executive Brief */}
            <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] space-y-2">
              <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                Executive Overview Brief
              </span>
              <p className="leading-relaxed text-[var(--text-primary)]">
                {structured.executiveOverview}
              </p>
            </div>

            {/* Note Card 2: Core Strengths */}
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                Validated Strengths ({structured.productStrengths?.length || 0})
              </span>
              <ul className="space-y-1">
                {structured.productStrengths?.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[var(--text-primary)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>{s.title}:</strong> {s.explanation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Note Card 3: Critical Pain Points */}
            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
              <span className="font-bold text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-300 block">
                High-Severity Friction ({structured.customerPainPoints?.length || 0})
              </span>
              <ul className="space-y-1">
                {structured.customerPainPoints?.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[var(--text-primary)]">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>{p.title}:</strong> {p.explanation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Note Card 4: Roadmap Priorities */}
            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
              <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                Recommended Priorities ({structured.recommendations?.length || 0})
              </span>
              <div className="space-y-1.5">
                {structured.recommendations?.map((r, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text-primary)]">
                    <div className="font-semibold flex items-center justify-between">
                      <span>• {r.action}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono">
                        {r.applicability}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{r.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : structured ? (
          /* 13-Section Full Product Review */
          <div className="space-y-5 text-xs">
            {/* Deterministic Stats Bar */}
            {stats && (
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-center">
                <div>
                  <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {stats.totalSourcesCount}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    Sources Analyzed
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {stats.uniqueCitedSourcesCount}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    Cited Sources
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold text-[var(--text-primary)] font-mono">
                    {Math.round((stats.evidenceSampleCoverageRatio || 0) * 100)}%
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    Coverage Ratio
                  </div>
                </div>
              </div>
            )}

            {/* 1. Executive Overview */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                1. Executive Overview
              </h4>
              <p className="leading-relaxed text-[var(--text-primary)] bg-[var(--surface-subtle)] p-3 rounded-xl border border-[var(--border-subtle)]">
                {structured.executiveOverview}
              </p>
            </div>

            {/* 2. Product Understanding */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                2. Product Understanding
              </h4>
              <div className="p-3 rounded-xl border border-[var(--border-subtle)] space-y-2 bg-[var(--surface-subtle)]/40">
                <p className="leading-relaxed text-[var(--text-primary)]">
                  {structured.productUnderstanding}
                </p>
              </div>
            </div>

            {/* 3. Key Highlights */}
            {structured.keyHighlights && structured.keyHighlights.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  3. Key Highlights
                </h4>
                <ul className="space-y-1 pl-1">
                  {structured.keyHighlights.map((hl, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[var(--text-primary)]">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. Product Strengths */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                4. Validated Strengths
              </h4>
              <div className="grid gap-2">
                {structured.productStrengths?.map((s, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                    <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                      {s.title}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">{s.explanation}</p>
                    {s.interpretation && (
                      <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 italic">
                        Strategic context: {s.interpretation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Customer Pain Points */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                5. Customer Pain Points
              </h4>
              <div className="grid gap-2">
                {structured.customerPainPoints?.map((p, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1">
                    <div className="font-semibold text-rose-800 dark:text-rose-300 flex items-center justify-between">
                      <span>{p.title}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">{p.explanation}</p>
                    {p.interpretation && (
                      <p className="text-[10px] text-rose-700/80 dark:text-rose-300/80 italic">
                        Root cause: {p.interpretation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Feature Requests */}
            {structured.featureRequests && structured.featureRequests.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  6. High-Impact Feature Requests
                </h4>
                <div className="grid gap-2">
                  {structured.featureRequests.map((f, i) => (
                    <div key={i} className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] space-y-1">
                      <div className="font-semibold text-[var(--text-primary)]">{f.title}</div>
                      <p className="text-[11px] text-[var(--text-muted)]">{f.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. UX Assessment */}
            {structured.userExperienceAssessment && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  7. User Experience & Accessibility
                </h4>
                <p className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-primary)] leading-relaxed">
                  {structured.userExperienceAssessment}
                </p>
              </div>
            )}

            {/* 9. Documentation Alignment (4-Quadrant Grid) */}
            {structured.documentationAlignment && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  9. Documentation Alignment (4-Quadrant)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {/* Agreement */}
                  <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 block">
                      Confirmed Agreements
                    </span>
                    <ul className="space-y-0.5">
                      {structured.documentationAlignment.agreement?.map((item: string, idx: number) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Contradictions */}
                  <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1">
                    <span className="font-bold text-rose-700 dark:text-rose-300 block">
                      Direct Contradictions
                    </span>
                    <ul className="space-y-0.5">
                      {structured.documentationAlignment.contradiction?.map((item: string, idx: number) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Docs */}
                  <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
                    <span className="font-bold text-amber-700 dark:text-amber-300 block">
                      Missing Documentation
                    </span>
                    <ul className="space-y-0.5">
                      {structured.documentationAlignment.missingDocumentation?.map((item: string, idx: number) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Unverified */}
                  <div className="p-2.5 rounded-xl border border-slate-500/20 bg-slate-500/5 space-y-1">
                    <span className="font-bold text-[var(--text-muted)] block">
                      Unverified Assumptions
                    </span>
                    <ul className="space-y-0.5">
                      {structured.documentationAlignment.unverifiedAssumptions?.map((item: string, idx: number) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 11. Recommendations Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                11. Strategic Recommendations
              </h4>
              <div className="space-y-2">
                {structured.recommendations?.map((r, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[11px] space-y-1">
                    <div className="font-bold text-xs text-[var(--text-primary)] flex items-center justify-between">
                      <span>• {r.action}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {r.applicability}
                      </span>
                    </div>
                    <p className="text-[var(--text-muted)]">{r.reason}</p>
                    {r.suggestedSuccessMeasure && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Target Metric: {r.suggestedSuccessMeasure}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 12. Evidence Gaps */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-[11px] space-y-1 text-[var(--text-muted)]">
              <span className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                12. Transparent Evidence Gaps
              </span>
              <p>{structured.evidenceGaps}</p>
            </div>

            {/* 13. Overall Assessment */}
            <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-1.5">
              <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">
                13. Overall Strategic Verdict
              </span>
              <p className="text-[var(--text-primary)] leading-relaxed">
                {structured.overallAssessment}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
