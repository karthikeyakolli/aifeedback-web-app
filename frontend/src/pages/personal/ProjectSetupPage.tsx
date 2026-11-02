import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Lock,
  Globe,
  GitBranch,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RotateCcw,
  FileText,
  Shield,
} from 'lucide-react';
import { api } from '../../services/api';
import type { Project, ProjectCategory, ProjectStatus } from '../../types';
import { Button } from '../../components/common/Button';
import { ProjectReviewTab } from '../../components/product/ProjectReviewTab';
import { cn } from '../../lib/utils';

const APPROVED_CATEGORIES: { id: ProjectCategory; label: string }[] = [
  { id: 'developer-tools', label: 'Developer Tools' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'ai-ml', label: 'AI & Machine Learning' },
  { id: 'design-ux', label: 'Design & UX' },
  { id: 'saas-b2b', label: 'SaaS & B2B' },
  { id: 'mobile', label: 'Mobile Apps' },
  { id: 'infrastructure', label: 'Infrastructure' },
];

export const ProjectSetupPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable Form Fields
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('developer-tools');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('draft');
  const [isPublic, setIsPublic] = useState(false);

  // Status & Notifications
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'context' | 'review' | 'links' | 'settings'>('context');

  // Deletion & Visibility state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isVisibilityUpdating, setIsVisibilityUpdating] = useState(false);

  const draftKey = `pri_project_draft_${id}`;

  // 1. Fetch Project Data from Backend
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setLoadError(null);

    api.getProject(id)
      .then((data) => {
        setProject(data);
        setName(data.name);
        setTagline(data.tagline);
        setCategory(data.category);
        setDescription(data.description || '');
        setRepositoryUrl(data.repositoryUrl || '');
        setDemoUrl(data.demoUrl || '');
        setStatus(data.status);
        setIsPublic(data.isPublic);

        // Check if a local unsaved draft exists
        try {
          const saved = localStorage.getItem(`pri_project_draft_${id}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.savedAt && new Date(parsed.savedAt) > new Date(data.updatedAt)) {
              if (parsed.description && parsed.description !== data.description) {
                setDescription(parsed.description);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to parse local draft', e);
        }
      })
      .catch((err: any) => {
        setLoadError(err.message || 'Failed to load project details.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  // 2. Auto-save local recovery buffer
  useEffect(() => {
    if (!id || isLoading || !project) return;
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        name,
        tagline,
        category,
        description,
        repositoryUrl,
        demoUrl,
        status,
        isPublic,
        savedAt: new Date().toISOString(),
      })
    );
  }, [id, name, tagline, category, description, repositoryUrl, demoUrl, status, isPublic, isLoading, project, draftKey]);

  // 3. Unsaved changes calculation
  const isDirty = Boolean(
    project &&
      (name !== project.name ||
        tagline !== project.tagline ||
        category !== project.category ||
        description !== (project.description || '') ||
        repositoryUrl !== (project.repositoryUrl || '') ||
        demoUrl !== (project.demoUrl || '') ||
        status !== project.status ||
        isPublic !== project.isPublic)
  );

  // 4. Window beforeunload prompt if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 3) {
      errs.name = 'Project name must be at least 3 characters.';
    }
    if (!tagline.trim() || tagline.trim().length < 10) {
      errs.tagline = 'Tagline must be at least 10 characters.';
    }
    if (status === 'ready' && description.trim().length < 20) {
      errs.description = 'A detailed description (at least 20 characters) is required to mark project as Ready for Review.';
    }
    if (repositoryUrl.trim()) {
      const u = repositoryUrl.trim();
      if (!u.startsWith('http://') && !u.startsWith('https://')) {
        errs.repositoryUrl = 'Repository URL must start with http:// or https://';
      }
    }
    if (demoUrl.trim()) {
      const u = demoUrl.trim();
      if (!u.startsWith('http://') && !u.startsWith('https://')) {
        errs.demoUrl = 'Demo URL must start with http:// or https://';
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id || !validate() || isSubmitting) return;

    setIsSubmitting(true);
    setServerError(null);
    setSaveSuccess(false);

    try {
      const updated = await api.updateProject(id, {
        name: name.trim(),
        tagline: tagline.trim(),
        category,
        description: description.trim(),
        repositoryUrl: repositoryUrl.trim() || null,
        demoUrl: demoUrl.trim() || null,
        status,
        isPublic,
      });

      setProject(updated);
      localStorage.removeItem(draftKey);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setServerError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    if (!project) return;
    if (window.confirm('Discard all unsaved changes and revert to server state?')) {
      setName(project.name);
      setTagline(project.tagline);
      setCategory(project.category);
      setDescription(project.description || '');
      setRepositoryUrl(project.repositoryUrl || '');
      setDemoUrl(project.demoUrl || '');
      setStatus(project.status);
      setIsPublic(project.isPublic);
      setFieldErrors({});
      localStorage.removeItem(draftKey);
    }
  };

  const handleConfirmPublish = async () => {
    if (!id || isVisibilityUpdating) return;
    setIsVisibilityUpdating(true);
    setServerError(null);
    try {
      const updated = await api.updateProject(id, {
        name: name.trim(),
        tagline: tagline.trim(),
        category,
        description: description.trim(),
        repositoryUrl: repositoryUrl.trim() || null,
        demoUrl: demoUrl.trim() || null,
        status,
        isPublic: true,
      });
      setIsPublic(true);
      setProject(updated);
      setIsPublishModalOpen(false);
      localStorage.removeItem(draftKey);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setServerError(err.message || 'Failed to publish project.');
    } finally {
      setIsVisibilityUpdating(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!id || isVisibilityUpdating) return;
    setIsVisibilityUpdating(true);
    setServerError(null);
    try {
      const updated = await api.updateProject(id, {
        name: name.trim(),
        tagline: tagline.trim(),
        category,
        description: description.trim(),
        repositoryUrl: repositoryUrl.trim() || null,
        demoUrl: demoUrl.trim() || null,
        status,
        isPublic: false,
      });
      setIsPublic(false);
      setProject(updated);
      setIsRevokeModalOpen(false);
      localStorage.removeItem(draftKey);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setServerError(err.message || 'Failed to revoke public access.');
    } finally {
      setIsVisibilityUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.deleteProject(id);
      localStorage.removeItem(draftKey);
      navigate('/personal');
    } catch (err: any) {
      alert(err.message || 'Failed to delete project.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="w-32 h-4 bg-[var(--surface-hover)] rounded-md" />
        <div className="w-1/2 h-7 bg-[var(--surface-hover)] rounded-md" />
        <div className="h-64 bg-[var(--surface)] border border-[var(--border-default)] rounded-2xl" />
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Project Not Found</h2>
        <p className="text-xs text-[var(--text-muted)]">{loadError || 'This project could not be found or you do not have permission to access it.'}</p>
        <Link to="/personal">
          <Button variant="outline" size="sm">Back to Personal Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div className="space-y-1">
          <Link
            to="/personal"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Personal Projects</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {project.name}
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-muted)]">
              {project.category}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              disabled={isSubmitting}
              className="text-xs gap-1.5 text-rose-500 hover:text-rose-600"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Discard
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSave()}
            disabled={isSubmitting || !isDirty}
            className="text-xs font-bold gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}</span>
          </Button>

          {/* Quick AI Review Launcher */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('review')}
            className={cn(
              'text-xs font-bold gap-1.5',
              activeTab === 'review' && 'bg-[var(--accent)] text-white'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Review</span>
            {project.reviewsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px] font-mono">
                {project.reviewsCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Notifications & Success Banners */}
      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Project settings and context successfully saved.</span>
        </div>
      )}

      {serverError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-default)]">
        {[
          { id: 'context', label: 'Technical Context & Specs', icon: FileText },
          { id: 'review', label: 'AI Review & Feedback', icon: Sparkles },
          { id: 'links', label: 'Links & Visibility', icon: Globe },
          { id: 'settings', label: 'Lifecycle & Danger Zone', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer -mb-px',
                isSelected
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'context' && (
        <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Core Metadata & Context</h3>
            <p className="text-xs text-[var(--text-muted)]">
              This information directly grounds the AI Review Engine during feedback generation.
            </p>
          </div>

          {/* Name & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="setup-name" className="text-xs font-bold text-[var(--text-primary)]">
                Project Name
              </label>
              <input
                id="setup-name"
                type="text"
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
              {fieldErrors.name && <p className="text-[11px] text-rose-500">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="setup-category" className="text-xs font-bold text-[var(--text-primary)]">
                Category
              </label>
              <select
                id="setup-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                {APPROVED_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="setup-tagline" className="text-xs font-bold text-[var(--text-primary)]">
              Tagline
            </label>
            <input
              id="setup-tagline"
              type="text"
              value={tagline}
              maxLength={200}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
            {fieldErrors.tagline && <p className="text-[11px] text-rose-500">{fieldErrors.tagline}</p>}
          </div>

          {/* Deep Markdown Specification */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="setup-description" className="font-bold text-[var(--text-primary)]">
                Technical Specification & Context (Markdown Supported)
              </label>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                {description.length} characters
              </span>
            </div>
            <textarea
              id="setup-description"
              rows={12}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste or draft comprehensive architectural specifications, problem statements, UX wireframe notes, or specific areas where you need AI feedback..."
              className="w-full p-4 rounded-xl text-xs sm:text-sm font-mono border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] leading-relaxed"
            />
            {fieldErrors.description && <p className="text-[11px] text-rose-500">{fieldErrors.description}</p>}
            <p className="text-[11px] text-[var(--text-muted)]">
              Tip: The more detailed your technical specification, the higher the precision of the AI feedback audit findings.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'review' && (
        <ProjectReviewTab
          project={project}
          onProjectUpdated={() => {
            if (id) {
              api.getProject(id).then(setProject).catch(console.error);
            }
          }}
          onSwitchToContextTab={() => setActiveTab('context')}
        />
      )}

      {activeTab === 'links' && (
        <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">External Links & Visibility</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Configure URLs and govern whether this project is published to Public Explore.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="setup-repo" className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                <span>Repository URL</span>
              </label>
              <input
                id="setup-repo"
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/organization/repository"
                className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
              {fieldErrors.repositoryUrl && <p className="text-[11px] text-rose-500">{fieldErrors.repositoryUrl}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="setup-demo" className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Live Prototype / Demo URL</span>
              </label>
              <input
                id="setup-demo"
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://prototype.example.dev"
                className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
              {fieldErrors.demoUrl && <p className="text-[11px] text-rose-500">{fieldErrors.demoUrl}</p>}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="pt-4 border-t border-[var(--border-default)] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isPublic ? (
                    <Globe className="w-4 h-4 text-sky-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {isPublic ? 'Published to Public Space' : 'Private to Personal Space'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] max-w-md">
                  {isPublic
                    ? 'This project is publicly discoverable on the Explore feed. Community members can inspect your project specs and verified AI review findings.'
                    : 'This project is private and visible only to you. Direct public requests return 404 Not Found. You can publish it at any time.'}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                onClick={() => (isPublic ? setIsRevokeModalOpen(true) : setIsPublishModalOpen(true))}
                disabled={isVisibilityUpdating}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-50',
                  isPublic ? 'bg-[var(--accent)]' : 'bg-slate-300 dark:bg-slate-700'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                    isPublic ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {isPublic && (
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="text-[var(--text-secondary)] truncate">
                    Live Public URL: <span className="font-mono text-sky-600 dark:text-sky-400">/public/projects/{id}</span>
                  </span>
                </div>
                <Link
                  to={`/public/projects/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400 hover:underline shrink-0"
                >
                  <span>Open Public View</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Lifecycle Status Management */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Project Lifecycle Stage</h3>
              <p className="text-xs text-[var(--text-muted)]">
                Progress your project through the structured feedback lifecycle.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'draft', label: 'Draft', desc: 'Setup in progress' },
                { id: 'ready', label: 'Ready for Review', desc: 'Context ready for AI audit' },
                { id: 'archived', label: 'Archived', desc: 'Retired from active work' },
              ].map((opt) => {
                const isSelected = status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatus(opt.id as ProjectStatus)}
                    className={cn(
                      'p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 font-bold'
                        : 'border-[var(--border-default)] bg-[var(--canvas)] hover:bg-[var(--surface-hover)]'
                    )}
                  >
                    <div className="text-xs font-bold text-[var(--text-primary)]">{opt.label}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-4 h-4" />
              <h3 className="text-sm font-bold">Danger Zone</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Permanently delete this project and all its technical specifications, AI feedback audits, and findings checklist items.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-bold text-xs"
            >
              Delete Project
            </Button>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {isPublishModalOpen && (
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
                <h3 className="text-base font-bold text-[var(--text-primary)]">Publish to Public Space</h3>
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
                disabled={isVisibilityUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmPublish}
                disabled={isVisibilityUpdating}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isVisibilityUpdating ? 'Publishing...' : 'Confirm & Publish'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Visibility Confirmation Modal */}
      {isRevokeModalOpen && (
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
                Are you sure you want to make <span className="font-bold">{project.name}</span> private?
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
                <li>This project will be immediately removed from the Public Explore feed and search results.</li>
                <li>Direct requests to <code className="text-amber-700 dark:text-amber-300 font-mono">/public/projects/{id}</code> will immediately return <strong className="text-[var(--text-primary)]">404 Not Found</strong>.</li>
                <li>Community members will no longer be able to view findings or upvote.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRevokeModalOpen(false)}
                disabled={isVisibilityUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRevoke}
                disabled={isVisibilityUpdating}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isVisibilityUpdating ? 'Revoking...' : 'Confirm & Make Private'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-rose-600">Permanently Delete Project</h3>
            <p className="text-xs text-[var(--text-muted)]">
              This action cannot be undone. Are you sure you want to delete <span className="font-bold text-[var(--text-primary)]">{project.name}</span>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleDelete} disabled={isDeleting} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
