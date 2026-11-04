import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  Zap,
  Check,
  RefreshCw,
  Quote,
  Download,
  Copy,
  GitCompare,
  History,
  Search,
  X,
  ArrowRight,
  FileText,
  Hash,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../../services/api';
import type {
  Project,
  FeedbackReport,
  AIReviewStatus,
  FeedbackReportComparison,
  FindingEvidenceCitation,
} from '../../types';
import { Button } from '../common/Button';
import { cn } from '../../lib/utils';

interface ProjectReviewTabProps {
  project: Project;
  onProjectUpdated?: () => void;
  onSwitchToContextTab?: () => void;
}

const AVAILABLE_FOCUS_AREAS = [
  { id: 'security', label: 'Security & Auth', icon: Shield },
  { id: 'architecture', label: 'Architecture & Design', icon: Layers },
  { id: 'performance', label: 'Performance & Scale', icon: Zap },
  { id: 'dx', label: 'Developer Experience', icon: RefreshCw },
];

export const ProjectReviewTab: React.FC<ProjectReviewTabProps> = ({
  project,
  onProjectUpdated,
  onSwitchToContextTab,
}) => {
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [allReports, setAllReports] = useState<FeedbackReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const [activeReview, setActiveReview] = useState<AIReviewStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Comparison State
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonBaseId, setComparisonBaseId] = useState<string>('');
  const [comparisonTargetId, setComparisonTargetId] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<FeedbackReportComparison | null>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Focus areas for new review run
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(['security', 'architecture']);

  // Findings UI filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'blocker' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'addressed'>('all');
  const [updatingFindingId, setUpdatingFindingId] = useState<string | null>(null);

  // Citations inspection state
  const [expandedCitationFindingIds, setExpandedCitationFindingIds] = useState<Record<string, boolean>>({});
  const [citationCache, setCitationCache] = useState<Record<string, FindingEvidenceCitation[]>>({});
  const [loadingCitationsFindingId, setLoadingCitationsFindingId] = useState<string | null>(null);

  const toggleCitations = async (findingId: string) => {
    const isExpanded = !expandedCitationFindingIds[findingId];
    setExpandedCitationFindingIds(prev => ({ ...prev, [findingId]: isExpanded }));

    if (isExpanded && !citationCache[findingId]) {
      setLoadingCitationsFindingId(findingId);
      try {
        const citations = await api.getFindingCitations(findingId);
        setCitationCache(prev => ({ ...prev, [findingId]: citations }));
      } catch (err) {
        console.error('Failed to load citations for finding:', err);
      } finally {
        setLoadingCitationsFindingId(null);
      }
    }
  };

  // Real elapsed timer for active review
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const descLength = (project.description || '').trim().length;
  const hasSufficientContext = descLength >= 20;

  // 1. Initial Load: Fetch all reports and reviews
  const loadReviewState = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [reports, reviews] = await Promise.all([
        api.getProjectReports(project.id).catch(() => []),
        api.getProjectReviews(project.id).catch(() => []),
      ]);

      setAllReports(reports);

      if (reports.length > 0) {
        setReport(reports[0]);
        setSelectedReportId(reports[0].id);

        if (reports.length > 1) {
          setComparisonBaseId(reports[reports.length - 1].id);
          setComparisonTargetId(reports[0].id);
        }
      } else {
        setReport(null);
        setSelectedReportId(null);
      }

      // Check for in-flight review
      const running = reviews.find((r) => r.status === 'queued' || r.status === 'processing');
      if (running) {
        setActiveReview(running);
      } else {
        setActiveReview(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load AI review information.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviewState();
  }, [project.id]);

  // 2. Poll active review if queued or processing
  useEffect(() => {
    if (!activeReview || (activeReview.status !== 'queued' && activeReview.status !== 'processing')) {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedSeconds((sec) => sec + 1);
    }, 1000);

    const pollInterval = setInterval(async () => {
      try {
        const updatedStatus = await api.getAIReviewStatus(project.id, activeReview.id);
        setActiveReview(updatedStatus);

        if (updatedStatus.status === 'completed') {
          clearInterval(pollInterval);
          // Reload all reports
          const refreshedReports = await api.getProjectReports(project.id);
          setAllReports(refreshedReports);
          if (refreshedReports.length > 0) {
            setReport(refreshedReports[0]);
            setSelectedReportId(refreshedReports[0].id);
          }
          if (onProjectUpdated) onProjectUpdated();
        } else if (updatedStatus.status === 'failed') {
          clearInterval(pollInterval);
          setErrorMessage(updatedStatus.errorMessage || 'AI review evaluation failed.');
          if (onProjectUpdated) onProjectUpdated();
        }
      } catch (err) {
        console.warn('Polling review status error:', err);
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeReview?.id, activeReview?.status, project.id]);

  // 3. Switch historical report
  const handleSelectReport = async (reportId: string) => {
    const target = allReports.find((r) => r.id === reportId);
    if (target) {
      setReport(target);
      setSelectedReportId(target.id);
    } else {
      try {
        const fetched = await api.getProjectReportById(project.id, reportId);
        setReport(fetched);
        setSelectedReportId(fetched.id);
      } catch (err: any) {
        alert(err.message || 'Failed to load historical report.');
      }
    }
  };

  // 4. Trigger New Review
  const handleStartReview = async () => {
    if (!hasSufficientContext || isStartingReview) return;

    setIsStartingReview(true);
    setErrorMessage(null);

    try {
      const reviewStatus = await api.startAIReview(project.id, {
        focus_areas: selectedFocusAreas,
      });

      setActiveReview(reviewStatus);

      if (reviewStatus.status === 'completed') {
        const refreshedReports = await api.getProjectReports(project.id);
        setAllReports(refreshedReports);
        if (refreshedReports.length > 0) {
          setReport(refreshedReports[0]);
          setSelectedReportId(refreshedReports[0].id);
        }
        if (onProjectUpdated) onProjectUpdated();
      } else if (reviewStatus.status === 'failed') {
        setErrorMessage(reviewStatus.errorMessage || 'AI review run encountered an error.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to trigger AI review.');
    } finally {
      setIsStartingReview(false);
    }
  };

  // 5. Update Finding Resolution Status
  const handleUpdateFindingStatus = async (
    findingId: string,
    newStatus: 'open' | 'in_progress' | 'addressed'
  ) => {
    if (!report || updatingFindingId) return;
    setUpdatingFindingId(findingId);

    try {
      const updatedFinding = await api.updateFindingStatus(findingId, newStatus);
      setReport((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          findings: prev.findings.map((f) => (f.id === findingId ? updatedFinding : f)),
        };
      });
      // Also update in allReports list
      setAllReports((prevList) =>
        prevList.map((r) =>
          r.id === report.id
            ? {
                ...r,
                findings: r.findings.map((f) => (f.id === findingId ? updatedFinding : f)),
              }
            : r
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update finding status.');
    } finally {
      setUpdatingFindingId(null);
    }
  };

  // 6. Export or Copy Markdown Report
  const handleExportMarkdown = async (downloadFile: boolean) => {
    if (!report || isExporting) return;
    setIsExporting(true);

    try {
      const exportData = await api.exportFeedbackReport(project.id, report.id);

      if (downloadFile) {
        const blob = new Blob([exportData.content], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = exportData.filename || `feedback-report-${project.id.slice(0, 8)}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        await navigator.clipboard.writeText(exportData.content);
        setCopiedReport(true);
        setTimeout(() => setCopiedReport(false), 2500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to export report.');
    } finally {
      setIsExporting(false);
    }
  };

  // 7. Compare Two Historical Reports
  const handleRunComparison = async () => {
    if (!comparisonBaseId || !comparisonTargetId || comparisonBaseId === comparisonTargetId) {
      alert('Please select two distinct historical iterations to compare.');
      return;
    }
    setIsLoadingComparison(true);
    try {
      const comp = await api.compareFeedbackReports(project.id, comparisonBaseId, comparisonTargetId);
      setComparisonData(comp);
    } catch (err: any) {
      alert(err.message || 'Failed to compare reports.');
    } finally {
      setIsLoadingComparison(false);
    }
  };

  const toggleFocusArea = (areaId: string) => {
    setSelectedFocusAreas((prev) =>
      prev.includes(areaId) ? prev.filter((a) => a !== areaId) : [...prev, areaId]
    );
  };

  // Filter findings by search, severity, and status
  const filteredFindings = (report?.findings || []).filter((f) => {
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(q);
      const matchObs = f.observation.toLowerCase().includes(q);
      const matchRec = f.recommendation.toLowerCase().includes(q);
      if (!matchTitle && !matchObs && !matchRec) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-center space-y-3">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[var(--accent)]" />
        <p className="text-xs text-[var(--text-muted)] font-medium">Loading feedback reports and review history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. In-flight review banner (real progress, zero fake percentages) */}
      {activeReview && (activeReview.status === 'queued' || activeReview.status === 'processing') && (
        <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  {activeReview.status === 'queued' ? 'Review Queued in Pipeline' : 'AI Review in Progress'}
                </h4>
                <p className="text-xs text-[var(--text-muted)]">
                  Synthesizing architecture, security, and quality analysis using {activeReview.provider} ({activeReview.modelId}).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-muted)]">
              <Clock className="w-3.5 h-3.5" />
              <span>{elapsedSeconds}s elapsed</span>
            </div>
          </div>
          <div className="w-full bg-[var(--surface-raised)] h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full w-2/3 animate-pulse rounded-full" />
          </div>
        </div>
      )}

      {/* 2. Error Display */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartReview}
            disabled={isStartingReview || !hasSufficientContext}
            className="text-xs shrink-0"
          >
            Retry Review
          </Button>
        </div>
      )}

      {/* 3. Review Preparation / Trigger Panel (Shown if no reports exist) */}
      {(!report || allReports.length === 0) && !activeReview && (
        <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  AI Review Preparation
                </h3>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Our AI Review Engine inspects your project specifications to deliver structured, evidence-grounded findings.
              </p>
            </div>
          </div>

          {/* Context Quality Check Banner */}
          {!hasSufficientContext ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2 text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Insufficient Project Context ({descLength} / 20 characters)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                The AI Review Engine requires at least 20 characters of technical description to evaluate your project accurately. Please add more details about architecture, tech stack, or problem statement.
              </p>
              {onSwitchToContextTab && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSwitchToContextTab}
                  className="text-xs mt-1"
                >
                  Edit Technical Context in Setup
                </Button>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Project description meets context requirement ({descLength} characters).</span>
            </div>
          )}

          {/* Focus Area Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary)]">
              Focus Areas for Review
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVAILABLE_FOCUS_AREAS.map((area) => {
                const Icon = area.icon;
                const isSelected = selectedFocusAreas.includes(area.id);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleFocusArea(area.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer',
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{area.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dominant Action Button */}
          <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">
              Cost: Free &bull; Output: Grounded Structured Report
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartReview}
              disabled={isStartingReview || !hasSufficientContext}
              className="text-xs font-bold gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isStartingReview ? 'Initiating Review...' : 'Start AI Review'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* 4. Synthesized Feedback Report View */}
      {report && (
        <div className="space-y-6">
          {/* Top Report Header & Control Strip */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    AI Feedback Report
                  </h3>
                  {allReports.length > 1 && (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Iteration {allReports.findIndex((r) => r.id === report.id) + 1} of {allReports.length}
                    </span>
                  )}
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-muted)]">
                    Audited {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Structured technical findings synthesized from project specifications.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Historical Iterations Switcher */}
                {allReports.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-[var(--canvas)] p-1 rounded-xl border border-[var(--border-default)]">
                    <History className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1" />
                    <select
                      value={selectedReportId || report.id}
                      onChange={(e) => handleSelectReport(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer pr-1"
                    >
                      {allReports.map((r, idx) => (
                        <option key={r.id} value={r.id}>
                          Iteration {allReports.length - idx} ({new Date(r.createdAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Compare Iterations Toggle */}
                {allReports.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsComparing(!isComparing);
                      if (!comparisonData && !isComparing) {
                        handleRunComparison();
                      }
                    }}
                    className={cn(
                      'text-xs font-semibold gap-1.5',
                      isComparing && 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]'
                    )}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Compare</span>
                  </Button>
                )}

                {/* Copy Markdown */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportMarkdown(false)}
                  disabled={isExporting}
                  className="text-xs font-semibold gap-1.5"
                  title="Copy Report to Clipboard"
                >
                  {copiedReport ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>

                {/* Download Markdown */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportMarkdown(true)}
                  disabled={isExporting}
                  className="text-xs font-semibold gap-1.5"
                  title="Download Markdown Report"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </Button>

                {/* Re-run Review */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartReview}
                  disabled={isStartingReview || !hasSufficientContext}
                  className="text-xs font-bold gap-1.5"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isStartingReview && 'animate-spin')} />
                  <span>{isStartingReview ? 'Running...' : 'Run New Review'}</span>
                </Button>
              </div>
            </div>

            {/* Findings Rollup Metrics Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-[var(--border-default)]">
              <div className="p-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--border-default)] text-center">
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Total Findings</p>
                <p className="text-lg font-extrabold text-[var(--text-primary)]">{report.totalFindingsCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Blockers</p>
                <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{report.blockersCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">High</p>
                <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{report.highCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-yellow-600 dark:text-yellow-400">Medium</p>
                <p className="text-lg font-extrabold text-yellow-600 dark:text-yellow-400">{report.mediumCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Low</p>
                <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{report.lowCount}</p>
              </div>
            </div>
          </div>

          {/* 5. Iteration Comparison Panel (if toggled) */}
          {isComparing && (
            <div className="p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-blue-500" />
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    Iteration Comparison
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[var(--text-muted)]">Base:</span>
                    <select
                      value={comparisonBaseId}
                      onChange={(e) => setComparisonBaseId(e.target.value)}
                      className="px-2 py-1 rounded-md text-xs border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)]"
                    >
                      {allReports.map((r, i) => (
                        <option key={r.id} value={r.id}>
                          Iteration {allReports.length - i}
                        </option>
                      ))}
                    </select>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[var(--text-muted)]">Target:</span>
                    <select
                      value={comparisonTargetId}
                      onChange={(e) => setComparisonTargetId(e.target.value)}
                      className="px-2 py-1 rounded-md text-xs border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)]"
                    >
                      {allReports.map((r, i) => (
                        <option key={r.id} value={r.id}>
                          Iteration {allReports.length - i}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRunComparison}
                    disabled={isLoadingComparison}
                    className="text-xs"
                  >
                    Compare
                  </Button>
                </div>
              </div>

              {isLoadingComparison ? (
                <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                  <RefreshCw className="w-4 h-4 mx-auto animate-spin mb-1 text-blue-500" />
                  Computing iteration diff...
                </div>
              ) : comparisonData ? (
                <div className="space-y-3 pt-2 border-t border-blue-500/20">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Resolved</p>
                      <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        {comparisonData.resolvedCount}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                      <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">New Findings</p>
                      <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                        {comparisonData.newCount}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] text-center">
                      <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Persisted</p>
                      <p className="text-base font-extrabold text-[var(--text-primary)]">
                        {comparisonData.persistedCount}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {comparisonData.items.map((item) => (
                      <div
                        key={item.findingId}
                        className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border-default)] flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-[var(--text-primary)] line-clamp-1">
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border shrink-0',
                            item.changeType === 'resolved'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : item.changeType === 'new'
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : 'bg-[var(--surface-raised)] text-[var(--text-muted)] border-[var(--border-default)]'
                          )}
                        >
                          {item.changeType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Executive & Strengths Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Executive Summary
              </h4>
              <p className="text-xs leading-relaxed text-[var(--text-primary)]">
                {report.executiveSummary}
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Identified Strengths
              </h4>
              <p className="text-xs leading-relaxed text-[var(--text-primary)]">
                {report.strengthsSummary}
              </p>
            </div>
          </div>

          {/* Actionable Findings Checklist Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  Actionable Findings Checklist ({filteredFindings.length} of {report.findings.length})
                </h4>
                <p className="text-xs text-[var(--text-muted)]">
                  Mark items as In Progress or Addressed as you implement improvements.
                </p>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search query */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search findings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)] w-36 sm:w-44"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Severity Filter */}
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg text-xs border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)]"
                >
                  <option value="all">All Severities</option>
                  <option value="blocker">Blockers only</option>
                  <option value="high">High only</option>
                  <option value="medium">Medium only</option>
                  <option value="low">Low only</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg text-xs border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)]"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="addressed">Addressed</option>
                </select>
              </div>
            </div>

            {/* Finding Cards */}
            {filteredFindings.length === 0 ? (
              <div className="p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-center text-xs text-[var(--text-muted)] space-y-2">
                <p>No findings match the selected filters or search query.</p>
                {(searchQuery || severityFilter !== 'all' || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSeverityFilter('all');
                      setStatusFilter('all');
                    }}
                    className="text-xs"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFindings.map((finding) => {
                  const isUpdating = updatingFindingId === finding.id;

                  const severityColor =
                    finding.severity === 'blocker'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      : finding.severity === 'high'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : finding.severity === 'medium'
                      ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';

                  const statusBadge =
                    finding.status === 'addressed'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : finding.status === 'in_progress'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                      : 'bg-[var(--surface-raised)] text-[var(--text-muted)] border-[var(--border-default)]';

                  return (
                    <div
                      key={finding.id}
                      className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4 hover:border-[var(--border-hover)] transition-all"
                    >
                      {/* Finding Card Top: Title, Severity, Category, Status Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                'text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border',
                                severityColor
                              )}
                            >
                              {finding.severity}
                            </span>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-muted)]">
                              {finding.category}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded border',
                                statusBadge
                              )}
                            >
                              {finding.status.replace('_', ' ')}
                            </span>
                            {finding.resolvedAt && (
                              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                                Resolved {new Date(finding.resolvedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <h5 className="text-sm font-bold text-[var(--text-primary)]">
                            {finding.title}
                          </h5>
                        </div>

                        {/* Interactive Status Changer Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {finding.status !== 'open' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateFindingStatus(finding.id, 'open')}
                              disabled={isUpdating}
                              className="px-2 py-1 rounded-md text-[11px] font-medium border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                            >
                              Open
                            </button>
                          )}
                          {finding.status !== 'in_progress' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateFindingStatus(finding.id, 'in_progress')}
                              disabled={isUpdating}
                              className="px-2 py-1 rounded-md text-[11px] font-medium border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 cursor-pointer"
                            >
                              In Progress
                            </button>
                          )}
                          {finding.status !== 'addressed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateFindingStatus(finding.id, 'addressed')}
                              disabled={isUpdating}
                              className="px-2 py-1 rounded-md text-[11px] font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Addressed</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Observation */}
                      <p className="text-xs leading-relaxed text-[var(--text-primary)]">
                        {finding.observation}
                      </p>

                      {/* Evidence Quote Callout */}
                      {finding.evidenceQuote && (
                        <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--border-default)] flex items-start gap-2.5">
                          <Quote className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
                              Grounded Evidence Quote
                            </span>
                            <p className="text-xs font-mono text-[var(--text-muted)] italic">
                              "{finding.evidenceQuote}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Traceable Evidence Coordinates & Citation Metadata */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => toggleCitations(finding.id)}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Hash className="w-3 h-3" />
                          <span>
                            {expandedCitationFindingIds[finding.id]
                              ? 'Hide Traceable Citations'
                              : 'Trace Evidence Citations (Source, Lines, Hash)'}
                          </span>
                          {expandedCitationFindingIds[finding.id] ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        {expandedCitationFindingIds[finding.id] && (
                          <div className="mt-2 p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Traceable Provenance Coordinates
                              </span>
                              {loadingCitationsFindingId === finding.id && (
                                <span className="text-blue-500 animate-pulse">Loading citations...</span>
                              )}
                            </div>

                            {(() => {
                              const citations = (finding.citations && finding.citations.length > 0)
                                ? finding.citations
                                : (citationCache[finding.id] || []);

                              if (citations.length === 0 && loadingCitationsFindingId !== finding.id) {
                                return (
                                  <p className="text-[11px] text-[var(--text-muted)] italic">
                                    No granular line coordinates indexed for this finding.
                                  </p>
                                );
                              }

                              return (
                                <div className="space-y-2">
                                  {citations.map((c, idx) => {
                                    const sourceId = c.sourceId || c.source_id || 'source_unknown';
                                    const snapshotId = c.snapshotId || c.snapshot_id;
                                    const lineStart = c.lineStart ?? c.line_start;
                                    const lineEnd = c.lineEnd ?? c.line_end;
                                    const charStart = c.charOffsetStart ?? c.char_offset_start;
                                    const charEnd = c.charOffsetEnd ?? c.char_offset_end;
                                    const pageNum = c.pageNumber ?? c.page_number;
                                    const quoteHash = c.contentHash || c.content_hash;
                                    const validation = c.validationResult || c.validation_result || 'exact_match';
                                    const quote = c.canonicalQuote || c.canonical_quote;

                                    return (
                                      <div
                                        key={c.id || idx}
                                        className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border-default)] text-xs space-y-1.5 font-mono"
                                      >
                                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                                            src: {sourceId.length > 16 ? sourceId.slice(0, 16) + '...' : sourceId}
                                          </span>
                                          {snapshotId && (
                                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                                              snap: {snapshotId.slice(0, 8)}
                                            </span>
                                          )}
                                          {lineStart !== null && lineStart !== undefined && (
                                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                                              L{lineStart}{lineEnd && lineEnd !== lineStart ? `-L${lineEnd}` : ''}
                                            </span>
                                          )}
                                          {charStart !== null && charStart !== undefined && (
                                            <span className="px-1.5 py-0.5 rounded bg-neutral-500/10 text-[var(--text-muted)]">
                                              chars {charStart}..{charEnd}
                                            </span>
                                          )}
                                          {pageNum && (
                                            <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">
                                              p.{pageNum}
                                            </span>
                                          )}
                                          {quoteHash && (
                                            <span className="px-1.5 py-0.5 rounded bg-neutral-500/10 text-[var(--text-muted)]">
                                              hash: {quoteHash.slice(0, 8)}
                                            </span>
                                          )}
                                          <span className="ml-auto px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold uppercase text-[9px]">
                                            {validation}
                                          </span>
                                        </div>

                                        {quote && (
                                          <p className="text-[11px] text-[var(--text-secondary)] italic border-l-2 border-blue-500/30 pl-2">
                                            "{quote}"
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Actionable Recommendation */}
                      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                          Concrete Recommendation
                        </span>
                        <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                          {finding.recommendation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
