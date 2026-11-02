import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  FolderKanban,
  ExternalLink,
  GitBranch,
  Lock,
  Globe,
  Trash2,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  FilterX,
} from 'lucide-react';
import { api } from '../../services/api';
import type { Project, ProjectStatus } from '../../types';
import { Button } from '../../components/common/Button';
import { cn } from '../../lib/utils';

export const PersonalHomePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Deletion modal state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getPersonalProjects({
        status: statusFilter,
        category: categoryFilter,
      });
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load personal projects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, categoryFilter]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase().trim();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete project.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Draft
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <CheckCircle2 className="w-3 h-3" /> Ready for Review
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 animate-pulse">
            <Sparkles className="w-3 h-3" /> In Review
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Reviewed
          </span>
        );
      case 'archived':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Archived
          </span>
        );
    }
  };

  const getDominantAction = (project: Project) => {
    switch (project.status) {
      case 'draft':
        return {
          label: 'Continue Setup',
          to: `/personal/projects/${project.id}/setup`,
          variant: 'primary' as const,
        };
      case 'ready':
        return {
          label: 'Start AI Review',
          to: `/personal/projects/${project.id}/setup`,
          variant: 'primary' as const,
        };
      case 'reviewed':
        return {
          label: 'View Feedback',
          to: `/personal/projects/${project.id}/setup`,
          variant: 'secondary' as const,
        };
      default:
        return {
          label: 'Open Project',
          to: `/personal/projects/${project.id}/setup`,
          variant: 'outline' as const,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Dominant Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Personal Projects
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Manage your prototypes, configure technical context, and prepare for AI feedback.
          </p>
        </div>

        <Link to="/personal/projects/new" className="shrink-0">
          <Button variant="primary" size="md" className="gap-2 shadow-sm font-semibold">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        </Link>
      </div>

      {/* 2. Controls Bar: Search, Category & Status Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Omnibox */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by project name, tagline, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="px-2.5 py-1.5 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <option value="all">All Categories</option>
              <option value="developer-tools">Developer Tools</option>
              <option value="productivity">Productivity</option>
              <option value="ai-ml">AI & ML</option>
              <option value="design-ux">Design & UX</option>
              <option value="saas-b2b">SaaS & B2B</option>
              <option value="mobile">Mobile Apps</option>
              <option value="infrastructure">Infrastructure</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All Projects' },
            { id: 'draft', label: 'Drafts' },
            { id: 'ready', label: 'Ready for Review' },
            { id: 'in_review', label: 'In Review' },
            { id: 'reviewed', label: 'Reviewed' },
            { id: 'archived', label: 'Archived' },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold shadow-2xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Surface Content Views */}
      {isLoading ? (
        // Loading Skeleton State
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="w-24 h-4 bg-[var(--surface-hover)] rounded-md" />
                <div className="w-20 h-4 bg-[var(--surface-hover)] rounded-md" />
              </div>
              <div className="space-y-2">
                <div className="w-3/4 h-5 bg-[var(--surface-hover)] rounded-md" />
                <div className="w-full h-3 bg-[var(--surface-hover)] rounded-md" />
              </div>
              <div className="pt-3 border-t border-[var(--border-default)] flex justify-between items-center">
                <div className="w-16 h-3 bg-[var(--surface-hover)] rounded-md" />
                <div className="w-24 h-7 bg-[var(--surface-hover)] rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Error State
        <div className="p-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center space-y-4">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Unable to Load Projects</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProjects} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        </div>
      ) : projects.length === 0 && statusFilter === 'all' && categoryFilter === 'all' && !searchQuery ? (
        // First-Time Empty State
        <div className="py-16 px-6 rounded-3xl border border-dashed border-[var(--border-default)] bg-[var(--surface)] text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              No Projects Created Yet
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Create your first project to organize technical specifications, generate structured AI reviews, and track actionable findings.
            </p>
          </div>
          <Link to="/personal/projects/new">
            <Button variant="primary" size="md" className="gap-2 font-semibold shadow-xs">
              <Plus className="w-4 h-4" />
              <span>Create Your First Project</span>
            </Button>
          </Link>
        </div>
      ) : filteredProjects.length === 0 ? (
        // No Search / Filter Results State
        <div className="py-12 px-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-center space-y-4">
          <FilterX className="w-8 h-8 mx-auto text-[var(--text-muted)]" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">No Matching Projects Found</h3>
            <p className="text-xs text-[var(--text-muted)]">
              No projects match your active search and filter criteria.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setCategoryFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        // Projects Grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const dominantAction = getDominantAction(project);
            return (
              <div
                key={project.id}
                className="group p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/40 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Meta: Category, Privacy, Status */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-muted)] truncate">
                        {project.category}
                      </span>
                      {project.isPublic ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-600 dark:text-sky-400">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)]">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      )}
                    </div>
                    <div>{getStatusBadge(project.status)}</div>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                    <Link to={`/personal/projects/${project.id}/setup`}>{project.name}</Link>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">
                    {project.tagline}
                  </p>

                  {/* Links preview if present */}
                  {(project.repositoryUrl || project.demoUrl) && (
                    <div className="flex items-center gap-3 mt-3 text-xs text-[var(--text-muted)]">
                      {project.repositoryUrl && (
                        <a
                          href={project.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
                          title="Repository Link"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[140px]">Repo</span>
                        </a>
                      )}
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
                          title="Live Demo Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[140px]">Live Demo</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between gap-2">
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {project.reviewsCount > 0 ? (
                      <span className="font-medium text-[var(--accent)]">
                        {project.reviewsCount} {project.reviewsCount === 1 ? 'Review' : 'Reviews'}
                      </span>
                    ) : (
                      <span>Not reviewed</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProjectToDelete(project)}
                      aria-label={`Delete ${project.name}`}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link to={dominantAction.to}>
                      <Button variant={dominantAction.variant} size="sm" className="font-semibold text-xs">
                        {dominantAction.label}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Project Deletion Confirmation Modal */}
      {projectToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-xl bg-rose-500/10">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 id="delete-dialog-title" className="text-base font-bold text-[var(--text-primary)]">
                Delete Project
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-[var(--text-primary)]">{projectToDelete.name}</span>? This action is permanent and will cascade-delete all associated context, AI reviews, and findings checklist items.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
