import React, { useState, useEffect } from 'react';
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
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Radio,
  GitCompare,
  ListChecks,
  TrendingUp,
  TrendingDown,
  FileText,
  MessageSquare,
} from 'lucide-react';
import type { ProductReview, Citation } from '../../types';
import { formatTimeAgo } from '../../lib/utils';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { cleanDisplayProse } from './ChatGPTMessage';

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

type StudioTab = 'full-review' | 'briefing-notes' | 'audio-briefing' | 'evolution-diff' | 'source-inspector';

interface PodcastLine {
  host: 'Alex' | 'Jordan';
  title: string;
  text: string;
}

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
  const [copiedIssueId, setCopiedIssueId] = useState<string | null>(null);

  // Audio Briefing Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Evolution Diff State
  const [diffBaseId, setDiffBaseId] = useState<string>(
    reviewsList.length > 1 ? reviewsList[0].id : ''
  );
  const [diffTargetId, setDiffTargetId] = useState<string>(
    reviewsList.length > 1 ? reviewsList[reviewsList.length - 1].id : ''
  );

  // Switch to inspector tab when a citation is selected
  useEffect(() => {
    if (inspectedCitation) {
      setActiveTab('source-inspector');
    }
  }, [inspectedCitation]);

  // Sync diff version selectors if review list updates
  useEffect(() => {
    if (reviewsList.length > 1) {
      if (!diffBaseId || !reviewsList.some((r) => r.id === diffBaseId)) {
        setDiffBaseId(reviewsList[0].id);
      }
      if (!diffTargetId || !reviewsList.some((r) => r.id === diffTargetId)) {
        setDiffTargetId(reviewsList[reviewsList.length - 1].id);
      }
    }
  }, [reviewsList]);

  // Clean up speech synthesis on unmount or pause
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const structured = selectedReview?.structuredOutput;
  const stats = selectedReview?.deterministicStats;

  // Generate Podcast Dialogue from structured findings
  const podcastScript: PodcastLine[] = React.useMemo(() => {
    if (!structured) return [];

    const lines: PodcastLine[] = [
      {
        host: 'Alex',
        title: 'Product Strategist',
        text: `Welcome to the deep dive on Review V${selectedReview?.version || 1}. Today we're examining community signals against our product specifications.`,
      },
      {
        host: 'Jordan',
        title: 'Lead Researcher',
        text: `Looking at the executive synthesis: ${structured.executiveOverview || 'The evidence paints a focused picture of real customer experiences.'}`,
      },
    ];

    if (structured.productStrengths && structured.productStrengths.length > 0) {
      const topStrength = structured.productStrengths[0];
      lines.push({
        host: 'Alex',
        title: 'Product Strategist',
        text: `On the positive side, our strongest verified validation is around "${topStrength.title}". ${topStrength.explanation}`,
      });
    }

    if (structured.customerPainPoints && structured.customerPainPoints.length > 0) {
      const topPain = structured.customerPainPoints[0];
      lines.push({
        host: 'Jordan',
        title: 'Lead Researcher',
        text: `However, the highest customer friction is "${topPain.title}". Users report that ${topPain.explanation}. Addressing this will prevent churn.`,
      });
    }

    if (structured.recommendations && structured.recommendations.length > 0) {
      const topRec = structured.recommendations[0];
      lines.push({
        host: 'Alex',
        title: 'Product Strategist',
        text: `Our clear P0 recommendation is: "${topRec.action}". ${topRec.reason}. Target measure: ${topRec.suggestedSuccessMeasure || 'Improved satisfaction'}.`,
      });
    }

    lines.push({
      host: 'Jordan',
      title: 'Lead Researcher',
      text: `All findings are strictly backed by verified citations. You can explore the full 13 sections or ask follow-ups in the research chat.`,
    });

    return lines;
  }, [structured, selectedReview?.version]);

  // Audio Playback Function using Web Speech Synthesis
  const playPodcastLine = (lineIdx: number) => {
    if (!isSpeechSupported || lineIdx >= podcastScript.length) {
      setIsPlayingAudio(false);
      setCurrentLineIndex(0);
      return;
    }

    window.speechSynthesis.cancel();
    setCurrentLineIndex(lineIdx);
    setIsPlayingAudio(true);

    const line = podcastScript[lineIdx];
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.rate = (line.host === 'Alex' ? 1.0 : 1.05) * playbackSpeed;
    utterance.pitch = line.host === 'Alex' ? 1.05 : 0.92;

    utterance.onend = () => {
      if (lineIdx + 1 < podcastScript.length) {
        playPodcastLine(lineIdx + 1);
      } else {
        setIsPlayingAudio(false);
        setCurrentLineIndex(0);
      }
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleToggleAudio = () => {
    if (!isSpeechSupported) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      playPodcastLine(currentLineIndex);
    }
  };

  const handleResetAudio = () => {
    if (isSpeechSupported) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setCurrentLineIndex(0);
  };

  // 1-Click Issue Copy Handler
  const handleCopyIssue = (
    rec: { action: string; applicability: string; reason: string; suggestedSuccessMeasure?: string },
    id: string
  ) => {
    const markdown = [
      `### [Priority Action] ${rec.action}`,
      ``,
      `- **Priority / Scope**: \`${rec.applicability}\``,
      rec.suggestedSuccessMeasure ? `- **Target Success Metric**: ${rec.suggestedSuccessMeasure}` : '',
      `- **Derived From**: Full Product Review V${selectedReview?.version || 1}`,
      ``,
      `#### Context & Rationale`,
      `${rec.reason}`,
      ``,
      `---`,
      `*Exported from AI Research Studio*`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(markdown);
    setCopiedIssueId(id);
    setTimeout(() => setCopiedIssueId(null), 2500);
  };

  // Evolution Diff Calculation
  const baseReview = reviewsList.find((r) => r.id === diffBaseId) || reviewsList[0];
  const targetReview = reviewsList.find((r) => r.id === diffTargetId) || reviewsList[reviewsList.length - 1];

  const diffStats = React.useMemo(() => {
    if (!baseReview || !targetReview || baseReview.id === targetReview.id) return null;

    const baseSources = baseReview.deterministicStats?.totalSourcesCount || 0;
    const targetSources = targetReview.deterministicStats?.totalSourcesCount || 0;
    const sourcesDelta = targetSources - baseSources;

    const baseCited = baseReview.deterministicStats?.uniqueCitedSourcesCount || 0;
    const targetCited = targetReview.deterministicStats?.uniqueCitedSourcesCount || 0;
    const citedDelta = targetCited - baseCited;

    const baseCoverage = Math.round((baseReview.deterministicStats?.evidenceSampleCoverageRatio || 0) * 100);
    const targetCoverage = Math.round((targetReview.deterministicStats?.evidenceSampleCoverageRatio || 0) * 100);
    const coverageDelta = targetCoverage - baseCoverage;

    // Resolved vs New Pain Points
    const basePains = baseReview.structuredOutput?.customerPainPoints || [];
    const targetPains = targetReview.structuredOutput?.customerPainPoints || [];

    const resolvedPains = basePains.filter(
      (bp) => !targetPains.some((tp) => tp.title.toLowerCase().includes(bp.title.toLowerCase().slice(0, 15)))
    );

    const newPains = targetPains.filter(
      (tp) => !basePains.some((bp) => bp.title.toLowerCase().includes(tp.title.toLowerCase().slice(0, 15)))
    );

    // New Recommendations
    const baseRecs = baseReview.structuredOutput?.recommendations || [];
    const targetRecs = targetReview.structuredOutput?.recommendations || [];
    const newRecs = targetRecs.filter(
      (tr) => !baseRecs.some((br) => br.action.toLowerCase().includes(tr.action.toLowerCase().slice(0, 15)))
    );

    return {
      sourcesDelta,
      citedDelta,
      coverageDelta,
      baseCoverage,
      targetCoverage,
      resolvedPains,
      newPains,
      newRecs,
    };
  }, [baseReview, targetReview]);

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
              <Badge
                variant="outline"
                className="px-1.5 py-0.2 text-[10px] font-mono border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
              >
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

        {/* Studio Sub-Tabs Carousel */}
        <div className="flex items-center gap-1 pt-1 border-t border-[var(--border-subtle)] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('full-review')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
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
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'briefing-notes'
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Studio Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audio-briefing')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'audio-briefing'
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Audio Overview</span>
            {isPlayingAudio && (
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
              </span>
            )}
          </button>
          {reviewsList.length > 1 && (
            <button
              type="button"
              onClick={() => setActiveTab('evolution-diff')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'evolution-diff'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <GitCompare className="w-3 h-3" />
              <span>Evolution Diff</span>
            </button>
          )}
          {inspectedCitation && (
            <button
              type="button"
              onClick={() => setActiveTab('source-inspector')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
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
        {/* EMPTY STATE: Interactive 3-Step Founder Launchpad */}
        {!selectedReview ? (
          <div className="space-y-4 p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
            <div className="text-center space-y-2 py-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                <ListChecks className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Founder Launchpad: 3 Steps to Full AI Review
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
                Calibrate the AI pipeline with your product specs and real community feedback.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-indigo-200 dark:border-indigo-800">
                  1
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Upload Product Specifications</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Drag and drop your PRD, README, or design document into the Sources rail to establish ground truth.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-indigo-200 dark:border-indigo-800">
                  2
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Collect Community Discussions</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    User reviews, friction points, and questions are automatically ingested and chunked for retrieval.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                  3
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Execute 7-Stage Review Pipeline</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Produces 13 structured sections with deterministic statistics, evidence citations, and linked chat.
                  </p>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={onTriggerNewReview}
              className="w-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs py-2 mt-2"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Generate Baseline Review V1
            </Button>
          </div>
        ) : activeTab === 'audio-briefing' ? (
          /* TAB: NotebookLM-style Audio Briefing (Dual-Host Podcast) */
          <div className="space-y-4">
            {/* Player Card */}
            <div className="p-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">
                      Audio Deep Dive: Review V{selectedReview.version}
                    </h4>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Two-host conversational briefing • {podcastScript.length} segments
                    </span>
                  </div>
                </div>

                {/* Speed Toggle */}
                <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg p-0.5 text-[10px]">
                  {[1.0, 1.25, 1.5].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${
                        playbackSpeed === speed
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Equalizer Animation */}
              <div className="h-6 flex items-end justify-center gap-1 px-4 py-1 bg-[var(--surface)]/60 rounded-xl border border-[var(--border-subtle)]/60">
                {[12, 24, 18, 28, 14, 26, 16, 22, 10, 20, 28, 15, 24, 18].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: isPlayingAudio ? `${Math.max(4, (h * (i % 2 === 0 ? 1 : 0.7)))}px` : '4px',
                      transition: 'height 0.2s ease',
                    }}
                    className={`w-1 rounded-full ${
                      isPlayingAudio
                        ? 'bg-indigo-500 animate-pulse'
                        : 'bg-[var(--border-subtle)]'
                    }`}
                  />
                ))}
              </div>

              {/* Playback Controls Bar */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResetAudio}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  title="Reset to beginning"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleToggleAudio}
                  className="text-xs h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="w-3.5 h-3.5 mr-1.5" />
                      Pause Overview
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Play Dual-Host Briefing
                    </>
                  )}
                </Button>

                <div className="text-[11px] font-mono text-[var(--text-muted)]">
                  {currentLineIndex + 1} / {podcastScript.length}
                </div>
              </div>

              {!isSpeechSupported && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  Note: Web Speech Synthesis is not active in this browser. You can read the conversational transcript below.
                </p>
              )}
            </div>

            {/* Conversational Transcript Feed */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Interactive Dialogue Transcript
              </span>

              <div className="space-y-2 text-xs">
                {podcastScript.map((line, idx) => {
                  const isActive = idx === currentLineIndex && isPlayingAudio;
                  const isAlex = line.host === 'Alex';

                  return (
                    <div
                      key={idx}
                      onClick={() => playPodcastLine(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-xs ring-1 ring-indigo-500/30'
                          : 'border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAlex ? 'bg-indigo-500' : 'bg-purple-500'
                            }`}
                          />
                          <span className="font-bold text-[11px] text-[var(--text-primary)]">
                            {line.host}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            ({line.title})
                          </span>
                        </div>
                        {isActive && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                            <Radio className="w-3 h-3 animate-pulse" />
                            Speaking
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--text-primary)] leading-relaxed pl-3.5 border-l-2 border-[var(--border-subtle)]">
                        {line.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeTab === 'evolution-diff' ? (
          /* TAB: Version Evolution Diff (V1 vs V2) */
          <div className="space-y-4 text-xs">
            {/* Version Selectors Bar */}
            <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Compare Review Milestones
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] block mb-0.5">Base Version:</label>
                  <select
                    value={diffBaseId}
                    onChange={(e) => setDiffBaseId(e.target.value)}
                    className="w-full text-xs bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg p-1.5 text-[var(--text-primary)] cursor-pointer"
                  >
                    {reviewsList.map((r) => (
                      <option key={r.id} value={r.id}>
                        Review V{r.version} ({formatTimeAgo(r.createdAt)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] block mb-0.5">Target Version:</label>
                  <select
                    value={diffTargetId}
                    onChange={(e) => setDiffTargetId(e.target.value)}
                    className="w-full text-xs bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg p-1.5 text-[var(--text-primary)] cursor-pointer"
                  >
                    {reviewsList.map((r) => (
                      <option key={r.id} value={r.id}>
                        Review V{r.version} ({formatTimeAgo(r.createdAt)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {diffStats ? (
              <div className="space-y-4">
                {/* Metric Delta Cards */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                    <div className="text-base font-bold text-[var(--text-primary)] font-mono">
                      {diffStats.sourcesDelta >= 0 ? `+${diffStats.sourcesDelta}` : diffStats.sourcesDelta}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      Sources Ingested
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {diffStats.citedDelta >= 0 ? `+${diffStats.citedDelta}` : diffStats.citedDelta}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      Citations Grounded
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                    <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {diffStats.coverageDelta >= 0 ? `+${diffStats.coverageDelta}%` : `${diffStats.coverageDelta}%`}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      Coverage Shift
                    </div>
                  </div>
                </div>

                {/* Resolved Customer Friction */}
                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Mitigated / Resolved Friction ({diffStats.resolvedPains.length})</span>
                  </div>
                  {diffStats.resolvedPains.length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)] italic">
                      No earlier friction points completely resolved between these versions.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {diffStats.resolvedPains.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[var(--text-primary)]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>
                            <strong>{p.title}:</strong> {p.explanation}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Newly Emerged Concerns */}
                <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Newly Emerged Concerns ({diffStats.newPains.length})</span>
                  </div>
                  {diffStats.newPains.length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)] italic">
                      Zero new high-severity friction points detected in newer snapshot.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {diffStats.newPains.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[var(--text-primary)]">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span>
                            <strong>{p.title}:</strong> {p.explanation}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Newly Introduced Strategic Recommendations */}
                {diffStats.newRecs.length > 0 && (
                  <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-2">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                      New Action Items in Target Review ({diffStats.newRecs.length})
                    </span>
                    <div className="space-y-1.5">
                      {diffStats.newRecs.map((r, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text-primary)]">
                          <div className="font-semibold flex items-center justify-between">
                            <span>• {r.action}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">
                              {r.applicability}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{r.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                Select two different review versions above to view milestone evolution and friction shift.
              </div>
            )}
          </div>
        ) : activeTab === 'source-inspector' && inspectedCitation ? (
          /* TAB: Source Inspector View */
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
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-[var(--text-primary)] italic leading-relaxed">
              "{cleanDisplayProse(inspectedCitation.quoteSnippet)}"
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
                  {cleanDisplayProse(inspectedCitation.authorDisplay) || inspectedCitation.commentId}
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
              {inspectedCitation.pageNumber && (
                <div className="flex items-center justify-between">
                  <span>Page:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    Page {inspectedCitation.pageNumber}
                  </span>
                </div>
              )}
              {inspectedCitation.section && (
                <div className="flex items-center justify-between">
                  <span>Section:</span>
                  <span className="font-semibold text-[var(--text-primary)] max-w-44 truncate">
                    {cleanDisplayProse(inspectedCitation.section)}
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
          /* TAB: NotebookLM Studio Notes View */
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

            {/* Note Card 4: Roadmap Priorities + 1-Click Ticket Export */}
            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
              <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                Recommended Priorities ({structured.recommendations?.length || 0})
              </span>
              <div className="space-y-2">
                {structured.recommendations?.map((r, idx) => {
                  const issueKey = `briefing-rec-${idx}`;
                  const isCopied = copiedIssueId === issueKey;

                  return (
                    <div key={idx} className="p-2.5 rounded-lg bg-[var(--surface)] text-[var(--text-primary)] space-y-1.5">
                      <div className="font-semibold flex items-center justify-between">
                        <span>• {r.action}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono">
                          {r.applicability}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)]">{r.reason}</p>

                      <div className="flex items-center justify-between pt-1">
                        {r.suggestedSuccessMeasure && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Target: {r.suggestedSuccessMeasure}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopyIssue(r, issueKey)}
                          className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Copy as Linear / GitHub Issue Markdown"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy as Issue</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : structured ? (
          /* TAB: 13-Section Full Product Review */
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

            {/* 11. Recommendations Table + 1-Click Ticket Export */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                11. Strategic Recommendations
              </h4>
              <div className="space-y-2">
                {structured.recommendations?.map((r, i) => {
                  const issueKey = `sec11-rec-${i}`;
                  const isCopied = copiedIssueId === issueKey;

                  return (
                    <div key={i} className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[11px] space-y-1.5">
                      <div className="font-bold text-xs text-[var(--text-primary)] flex items-center justify-between">
                        <span>• {r.action}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {r.applicability}
                        </span>
                      </div>
                      <p className="text-[var(--text-muted)]">{r.reason}</p>

                      <div className="flex items-center justify-between pt-1">
                        {r.suggestedSuccessMeasure ? (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Target Metric: {r.suggestedSuccessMeasure}
                          </div>
                        ) : <div />}

                        <button
                          type="button"
                          onClick={() => handleCopyIssue(r, issueKey)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Copy as GitHub / Linear Issue Markdown"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy as Issue</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
