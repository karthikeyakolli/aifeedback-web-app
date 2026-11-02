import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ExternalLink,
  ChevronLeft,
  ChevronUp,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Share2,
  Check,
  Layers,
  Info,
  Calendar,
  User,
  Filter,
} from 'lucide-react';
import type { PublicProject, FeedbackReport } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { SeverityPill, type FindingSeverity } from '../../components/common/SeverityPill';
import { cn } from '../../lib/utils';

export const PublicProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, openAuthModal } = useAuth();

  const [project, setProject] = useState<PublicProject | null>(null);
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Upvote state
  const [upvotesCount, setUpvotesCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  // Finding filter
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setIsNotFound(false);

    Promise.allSettled([
      api.getPublicProject(id),
      api.getPublicFeedbackReport(id),
    ])
      .then(([projRes, repRes]) => {
        if (projRes.status === 'fulfilled') {
          const p = projRes.value;
          setProject(p);
          setUpvotesCount(p.upvotesCount);
        } else {
          setIsNotFound(true);
          return;
        }

        if (repRes.status === 'fulfilled') {
          setReport(repRes.value);
        }
      })
      .catch(() => {
        setIsNotFound(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleUpvote = async () => {
    if (!project) return;
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (isUpvoting) return;
    setIsUpvoting(true);

    const nextHasUpvoted = !hasUpvoted;
    const nextCount = nextHasUpvoted ? upvotesCount + 1 : Math.max(0, upvotesCount - 1);
    setUpvotesCount(nextCount);
    setHasUpvoted(nextHasUpvoted);

    try {
      const res = await api.upvotePublicProject(project.id);
      setUpvotesCount(res.upvotesCount);
      setHasUpvoted(res.hasUpvoted);
    } catch (err) {
      setUpvotesCount(upvotesCount);
      setHasUpvoted(hasUpvoted);
      console.error('Failed to upvote:', err);
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const filteredFindings = useMemo(() => {
    if (!report?.findings) return [];
    if (severityFilter === 'all') return report.findings;
    return report.findings.filter((f) => f.severity.toLowerCase() === severityFilter.toLowerCase());
  }, [report, severityFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <div className="h-6 w-32 bg-[var(--surface-hover)] rounded-md animate-pulse" />
        <div className="h-44 bg-[var(--surface)] border border-[var(--border-default)] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 bg-[var(--surface)] border border-[var(--border-default)] rounded-xl animate-pulse" />
          <div className="h-28 bg-[var(--surface)] border border-[var(--border-default)] rounded-xl animate-pulse" />
          <div className="h-28 bg-[var(--surface)] border border-[var(--border-default)] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isNotFound || !project) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)] flex items-center justify-center">
          <Layers className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Project Not Found</h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-sm mx-auto">
            This project does not exist, has had its public access revoked by its author, or is marked private. Private projects are strictly protected.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/explore">
            <Button variant="primary" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>Back to Public Explore</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          to="/explore"
          className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Public Explore</span>
        </Link>
        <span>/</span>
        <span className="capitalize">{project.category.replace(/-/g, ' ')}</span>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-semibold truncate max-w-xs">{project.name}</span>
      </div>

      {/* 2. Hero Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                {project.name}
              </h1>
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                {project.category}
              </span>
              <span className="text-xs font-mono capitalize px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {project.status}
              </span>
            </div>

            {project.tagline && (
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {project.tagline}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
              {project.creatorDisplayName && (
                <span className="flex items-center gap-1 font-medium">
                  <User className="w-3.5 h-3.5" />
                  <span>By {project.creatorDisplayName}</span>
                </span>
              )}
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Published {new Date(project.createdAt).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          {/* Action Header: Upvote & Share */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleUpvote}
              disabled={isUpvoting}
              aria-label={`Upvote ${project.name}`}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer shadow-xs',
                hasUpvoted
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              )}
            >
              <ChevronUp className="w-4 h-4" />
              <span>Upvote</span>
              <span className="ml-1 px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">
                {upvotesCount}
              </span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 text-xs font-medium"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied Link' : 'Share'}</span>
            </Button>
          </div>
        </div>

        {/* External Links Bar */}
        {(project.repositoryUrl || project.demoUrl) && (
          <div className="pt-4 border-t border-[var(--border-default)] flex flex-wrap items-center gap-3">
            {project.repositoryUrl && (
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Source Repository</span>
                <ExternalLink className="w-3 h-3 text-[var(--text-muted)] ml-0.5" />
              </a>
            )}

            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
                <span>Live Prototype / Demo</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* 3. Architectural Overview */}
      <div className="p-6 sm:p-7 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Project Specification & Architectural Overview
        </h2>
        <div className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
          {project.description || 'No detailed architecture description provided.'}
        </div>
      </div>

      {/* 4. Verified AI Review & Feedback Findings */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-default)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Automated AI Review Scrutiny</span>
            </div>
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Verified Feedback Report & Findings
            </h2>
          </div>

          {report && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{report.totalFindingsCount} Total Findings</span>
              </div>
            </div>
          )}
        </div>

        {!report ? (
          <div className="p-8 rounded-2xl border border-dashed border-[var(--border-default)] text-center space-y-3 bg-[var(--surface)]">
            <Sparkles className="w-8 h-8 mx-auto text-amber-500" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">No AI Review Published Yet</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              The project creator has not generated an automated AI feedback report for this public revision yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Finding Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center">
                <div className="text-lg font-black text-rose-600 dark:text-rose-400">{report.blockersCount}</div>
                <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Blockers</div>
              </div>
              <div className="p-3.5 rounded-xl border border-orange-500/20 bg-orange-500/5 text-center">
                <div className="text-lg font-black text-orange-600 dark:text-orange-400">{report.highCount}</div>
                <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase">High Severity</div>
              </div>
              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
                <div className="text-lg font-black text-amber-600 dark:text-amber-400">{report.mediumCount}</div>
                <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Medium</div>
              </div>
              <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-center">
                <div className="text-lg font-black text-blue-600 dark:text-blue-400">{report.lowCount}</div>
                <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Low</div>
              </div>
            </div>

            {/* Executive Summary & Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Executive Summary */}
              <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Executive Review Summary
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {report.executiveSummary}
                </p>
              </div>

              {/* Strengths */}
              <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Key Architectural Strengths</span>
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {report.strengthsSummary}
                </p>
              </div>
            </div>

            {/* Scrutiny Findings List */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Detailed Findings ({report.findings?.length || 0})
                </h3>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[var(--text-muted)] flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3" /> Filter:
                  </span>
                  {(['all', 'blocker', 'high', 'medium', 'low'] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer',
                        severityFilter === sev
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {filteredFindings.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                  No findings matching severity <span className="font-bold uppercase">{severityFilter}</span>.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <SeverityPill severity={finding.severity as FindingSeverity} size="sm" />
                          <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                            {finding.title}
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono capitalize px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-muted)] self-start sm:self-auto">
                          {finding.category}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {finding.observation}
                      </p>

                      {/* Supporting Evidence */}
                      {finding.evidenceQuote && (
                        <div className="text-xs bg-[var(--surface-raised)] p-3 rounded-xl border border-[var(--border-default)] space-y-1">
                          <span className="font-bold text-[var(--text-muted)] text-[11px] uppercase tracking-wider">
                            Supporting Evidence:
                          </span>
                          <blockquote className="italic border-l-2 border-indigo-500 pl-2.5 text-[var(--text-secondary)]">
                            "{finding.evidenceQuote}"
                          </blockquote>
                        </div>
                      )}

                      {/* Recommendation */}
                      {finding.recommendation && (
                        <div className="text-xs bg-indigo-500/5 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 text-indigo-900 dark:text-indigo-200">
                          <strong className="text-indigo-600 dark:text-indigo-400">Recommendation: </strong>
                          {finding.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Server-Side Projection Notice */}
      <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] flex items-start gap-3 text-xs text-[var(--text-muted)]">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-[var(--text-primary)]">Public Data Security Projection: </strong>
          This public page is strictly rendered using server-side projections. Private account identifiers, internal working notes, and prompt execution logs are permanently quarantined in the creator's Personal Space.
        </div>
      </div>
    </div>
  );
};
