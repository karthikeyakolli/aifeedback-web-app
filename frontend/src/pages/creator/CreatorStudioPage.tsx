import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Globe,
  Lock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Rocket,
  Plus,
  Terminal,
  User,
  Shield,
  Filter,
} from 'lucide-react';
import type { CreatorStudioOverview, CreatorShowcaseProject } from '../../types';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { cn } from '../../lib/utils';

export const CreatorStudioPage: React.FC = () => {
  const [data, setData] = useState<CreatorStudioOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'ready' | 'published' | 'drafts'>('all');

  // Confirmation modal states
  const [selectedProject, setSelectedProject] = useState<CreatorShowcaseProject | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadStudio = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const overview = await api.getCreatorStudio();
      setData(overview);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load Creator Studio');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudio();
  }, []);

  const filteredProjects = useMemo(() => {
    if (!data?.projects) return [];
    if (activeFilter === 'ready') return data.projects.filter((p) => p.readiness.isLaunchReady);
    if (activeFilter === 'published') return data.projects.filter((p) => p.isPublic);
    if (activeFilter === 'drafts') return data.projects.filter((p) => !p.isPublic);
    return data.projects;
  }, [data, activeFilter]);

  const handleOpenPublish = (project: CreatorShowcaseProject) => {
    setSelectedProject(project);
    setIsPublishModalOpen(true);
  };

  const handleOpenRevoke = (project: CreatorShowcaseProject) => {
    setSelectedProject(project);
    setIsRevokeModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    if (!selectedProject || isActionPending) return;
    setIsActionPending(true);
    try {
      await api.publishCreatorProject(selectedProject.id);
      setIsPublishModalOpen(false);
      setActionNotice(`Successfully published "${selectedProject.name}" to Public Space!`);
      setTimeout(() => setActionNotice(null), 4000);
      await loadStudio();
    } catch (err: any) {
      alert(err.message || 'Failed to publish project');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!selectedProject || isActionPending) return;
    setIsActionPending(true);
    try {
      await api.unpublishCreatorProject(selectedProject.id);
      setIsRevokeModalOpen(false);
      setActionNotice(`Revoked public visibility for "${selectedProject.name}". Direct links now return 404.`);
      setTimeout(() => setActionNotice(null), 4000);
      await loadStudio();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke publication');
    } finally {
      setIsActionPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="w-48 h-5 bg-[var(--surface-hover)] rounded-md" />
        <div className="w-1/3 h-8 bg-[var(--surface-hover)] rounded-md" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[var(--surface)] border border-[var(--border-default)] rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-[var(--surface)] border border-[var(--border-default)] rounded-2xl" />
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Unable to Load Creator Studio</h2>
        <p className="text-xs text-[var(--text-muted)]">{loadError || 'An unexpected error occurred.'}</p>
        <Button variant="outline" size="sm" onClick={loadStudio}>
          Try Again
        </Button>
      </div>
    );
  }

  const { metrics, projects } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* 1. Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Maker Showcase Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Creator Studio
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Manage project launch readiness, govern public showcase exposure, and audit verified technical credentials.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link to="/creator/profile">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <User className="w-3.5 h-3.5" />
              <span>Maker Profile</span>
            </Button>
          </Link>

          <Link to="/developer">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Review Lab</span>
            </Button>
          </Link>

          <Link to="/personal/projects/new">
            <Button variant="primary" size="sm" className="gap-1.5 text-xs font-bold shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </Button>
          </Link>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. Studio Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-1">
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Total Projects
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">{metrics.totalProjectsCount}</div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {metrics.publishedProjectsCount} published • {metrics.privateProjectsCount} private
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-sky-500/20 bg-sky-500/5 space-y-1">
          <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            <span>Public Showcases</span>
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">{metrics.publishedProjectsCount}</div>
          <div className="text-[11px] text-[var(--text-muted)]">
            Discoverable on Explore
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified AI Reviews</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.totalReviewsCompleted}</div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {metrics.totalOpenBlockers} open {metrics.totalOpenBlockers === 1 ? 'blocker' : 'blockers'}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-1">
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Upvotes Received
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{metrics.totalUpvotesReceived}</div>
          <div className="text-[11px] text-[var(--text-muted)]">
            Across published projects
          </div>
        </div>
      </div>

      {/* 3. Showcase & Launch Readiness Workspace */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-indigo-500" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Showcase Readiness & Launch Portfolio
            </h2>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] text-xs">
            <span className="text-[var(--text-muted)] px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" />
            </span>
            {(
              [
                { id: 'all', label: `All (${projects.length})` },
                { id: 'ready', label: 'Launch Ready' },
                { id: 'published', label: 'Published' },
                { id: 'drafts', label: 'Private Drafts' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer',
                  activeFilter === tab.id
                    ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface)] text-center space-y-3">
            <Layers className="w-8 h-8 mx-auto text-[var(--text-muted)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {activeFilter === 'ready'
                ? 'No projects currently marked Launch Ready'
                : activeFilter === 'published'
                ? 'No projects published to Public Space yet'
                : 'No projects found in this view'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Run an AI review in Personal Space and address blockers to achieve verified launch readiness.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Title, Category, Visibility Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[var(--text-primary)]">{proj.name}</h3>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-muted)]">
                          {proj.category}
                        </span>
                      </div>
                      {proj.tagline && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                          {proj.tagline}
                        </p>
                      )}
                    </div>

                    {/* Visibility Badge */}
                    {proj.isPublic ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-xs border border-sky-500/20 shrink-0">
                        <Globe className="w-3 h-3" />
                        <span>Published</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/10 text-[var(--text-muted)] font-medium text-xs border border-[var(--border-default)] shrink-0">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </span>
                    )}
                  </div>

                  {/* Launch Readiness Matrix */}
                  <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Rocket className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Launch Readiness Audit</span>
                      </span>
                      {proj.readiness.isLaunchReady ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ready for Showcase</span>
                        </span>
                      ) : (
                        <span className="font-medium text-amber-600 dark:text-amber-400 text-[11px]">
                          Action Required
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                        {proj.readiness.hasAiReview ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-[var(--text-muted)]" />
                        )}
                        <span>AI Review ({proj.reviewsCount})</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                        {proj.readiness.openBlockersCount === 0 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span>
                          {proj.readiness.openBlockersCount === 0
                            ? '0 Blockers'
                            : `${proj.readiness.openBlockersCount} Blockers`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                        {proj.readiness.hasRepoUrl ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-[var(--text-muted)]" />
                        )}
                        <span>Repository URL</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                        {proj.readiness.hasDemoUrl ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-[var(--text-muted)]" />
                        )}
                        <span>Live Prototype</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between gap-2">
                  <Link
                    to={`/personal/projects/${proj.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <span>Personal Workbench</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {proj.isPublic ? (
                      <>
                        <Link to={`/public/projects/${proj.id}`} target="_blank">
                          <Button variant="outline" size="sm" className="text-xs gap-1">
                            <span>Public View</span>
                            <ExternalLink className="w-3 h-3 text-sky-500" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenRevoke(proj)}
                          className="text-xs text-amber-600 hover:text-amber-700"
                        >
                          Revoke
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenPublish(proj)}
                        className="text-xs font-bold gap-1 bg-sky-600 hover:bg-sky-700 text-white"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Publish Showcase</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Publish Confirmation Modal */}
      {isPublishModalOpen && selectedProject && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Publish Project to Public Space</h3>
                <p className="text-xs text-[var(--text-muted)]">Make project specifications and AI feedback discoverable</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[var(--text-secondary)] bg-[var(--surface-raised)] p-4 rounded-xl border border-[var(--border-default)]">
              <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>What will be shared publicly:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
                <li>Project name, category, tagline, and architectural overview.</li>
                <li>Public code repository URL and live demonstration link.</li>
                <li>Verified AI Review executive summaries, score, and scrutiny findings.</li>
              </ul>
              <div className="pt-2 border-t border-[var(--border-default)] text-[11px] text-[var(--text-muted)]">
                <strong className="text-[var(--text-primary)]">Zero Data Leakage:</strong> Your personal account ID, private working notes, and prompt telemetry remain strictly protected behind server-side projection.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPublishModalOpen(false)}
                disabled={isActionPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmPublish}
                disabled={isActionPending}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isActionPending ? 'Publishing...' : 'Confirm & Publish'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Revoke Confirmation Modal */}
      {isRevokeModalOpen && selectedProject && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Revoke Public Access</h3>
                <p className="text-xs text-[var(--text-muted)]">Immediately hide this project from all public discovery</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[var(--text-secondary)] bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
              <p className="text-[var(--text-primary)]">
                Are you sure you want to revoke public access for <span className="font-bold">{selectedProject.name}</span>?
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
                <li>This project will be immediately removed from the Public Explore feed and search.</li>
                <li>Direct requests to <code className="text-amber-700 dark:text-amber-300 font-mono">/public/projects/{selectedProject.id}</code> will immediately return <strong className="text-[var(--text-primary)]">404 Not Found</strong>.</li>
                <li>Community members will no longer be able to view findings or upvote.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRevokeModalOpen(false)}
                disabled={isActionPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRevoke}
                disabled={isActionPending}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isActionPending ? 'Revoking...' : 'Confirm & Make Private'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
