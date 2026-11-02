import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  GitBranch,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import type { ProjectCategory } from '../../types';
import { Button } from '../../components/common/Button';

const DRAFT_KEY = 'pri_new_project_draft';

const APPROVED_CATEGORIES: { id: ProjectCategory; label: string; desc: string }[] = [
  { id: 'developer-tools', label: 'Developer Tools', desc: 'SDKs, CLIs, libraries, dev environments, git tools' },
  { id: 'productivity', label: 'Productivity', desc: 'Task planners, notes, workflow automation, calendars' },
  { id: 'ai-ml', label: 'AI & Machine Learning', desc: 'LLM agents, models, inference engines, prompts' },
  { id: 'design-ux', label: 'Design & UX', desc: 'Design systems, UI components, prototyping tools' },
  { id: 'saas-b2b', label: 'SaaS & B2B', desc: 'Cloud platforms, billing, CRM, analytics' },
  { id: 'mobile', label: 'Mobile Apps', desc: 'iOS, Android, cross-platform applications' },
  { id: 'infrastructure', label: 'Infrastructure', desc: 'Databases, networking, cloud infra, security' },
];

export const NewProjectPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('developer-tools');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name || parsed.tagline || parsed.description) {
          setName(parsed.name || '');
          setTagline(parsed.tagline || '');
          if (parsed.category) setCategory(parsed.category);
          setDescription(parsed.description || '');
          setRepositoryUrl(parsed.repositoryUrl || '');
          setDemoUrl(parsed.demoUrl || '');
          setHasRestoredDraft(true);
        }
      }
    } catch (e) {
      console.warn('Failed to parse draft from localStorage', e);
    }
  }, []);

  // Auto-save draft buffer to localStorage on input changes
  useEffect(() => {
    if (name || tagline || description || repositoryUrl || demoUrl) {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          name,
          tagline,
          category,
          description,
          repositoryUrl,
          demoUrl,
          savedAt: new Date().toISOString(),
        })
      );
    }
  }, [name, tagline, category, description, repositoryUrl, demoUrl]);

  // Window beforeunload warning if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (name.trim() || tagline.trim() || description.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [name, tagline, description]);

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    const cleanName = name.trim();
    if (!cleanName) {
      nextErrors.name = 'Project name is required.';
    } else if (cleanName.length < 3) {
      nextErrors.name = 'Project name must be at least 3 characters.';
    } else if (cleanName.length > 120) {
      nextErrors.name = 'Project name cannot exceed 120 characters.';
    }

    const cleanTagline = tagline.trim();
    if (!cleanTagline) {
      nextErrors.tagline = 'Tagline is required.';
    } else if (cleanTagline.length < 10) {
      nextErrors.tagline = 'Tagline must be at least 10 characters to provide clear context.';
    } else if (cleanTagline.length > 200) {
      nextErrors.tagline = 'Tagline cannot exceed 200 characters.';
    }

    if (repositoryUrl.trim()) {
      const u = repositoryUrl.trim();
      if (!u.startsWith('http://') && !u.startsWith('https://')) {
        nextErrors.repositoryUrl = 'Repository URL must begin with http:// or https://';
      }
    }

    if (demoUrl.trim()) {
      const u = demoUrl.trim();
      if (!u.startsWith('http://') && !u.startsWith('https://')) {
        nextErrors.demoUrl = 'Demo URL must begin with http:// or https://';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    // Prevent duplicate submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const created = await api.createProject({
        name: name.trim(),
        tagline: tagline.trim(),
        category,
        description: description.trim(),
        repositoryUrl: repositoryUrl.trim() || null,
        demoUrl: demoUrl.trim() || null,
      });

      // Clear draft storage
      localStorage.removeItem(DRAFT_KEY);

      // Navigate to Project Setup
      navigate(`/personal/projects/${created.id}/setup`);
    } catch (err: any) {
      setServerError(err.message || 'Failed to create project. Please verify inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscardDraft = () => {
    if (window.confirm('Are you sure you want to discard your draft? All entered fields will be cleared.')) {
      localStorage.removeItem(DRAFT_KEY);
      setName('');
      setTagline('');
      setDescription('');
      setRepositoryUrl('');
      setDemoUrl('');
      setErrors({});
      setServerError(null);
      setHasRestoredDraft(false);
    }
  };

  const isDirty = Boolean(name || tagline || description || repositoryUrl || demoUrl);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/personal"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>

        {isDirty && (
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Discard Draft</span>
          </button>
        )}
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Create New Project
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Set up basic information to establish your private project workspace. You will configure deep technical context in the next step.
        </p>
      </div>

      {/* Restored Draft Notice */}
      {hasRestoredDraft && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Restored unsaved project draft from your previous session.</span>
          </div>
          <button
            type="button"
            onClick={() => setHasRestoredDraft(false)}
            className="font-bold hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Server Error Alert */}
      {serverError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{serverError}</span>
        </div>
      )}

      {/* Primary Intake Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-5 shadow-xs">
        {/* 1. Project Name */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="project-name" className="font-bold text-[var(--text-primary)]">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">{name.length}/120</span>
          </div>
          <input
            id="project-name"
            type="text"
            required
            maxLength={120}
            placeholder="e.g., Rust CRDT Sync Engine"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-[var(--canvas)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all ${
              errors.name ? 'border-rose-500' : 'border-[var(--border-default)]'
            }`}
          />
          {errors.name ? (
            <p className="text-[11px] text-rose-500 font-medium">{errors.name}</p>
          ) : (
            <p className="text-[11px] text-[var(--text-muted)]">
              Clear, descriptive title for your prototype, tool, or library.
            </p>
          )}
        </div>

        {/* 2. Tagline */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="project-tagline" className="font-bold text-[var(--text-primary)]">
              Tagline <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">{tagline.length}/200</span>
          </div>
          <input
            id="project-tagline"
            type="text"
            required
            maxLength={200}
            placeholder="e.g., Offline-first state synchronization engine for collaborative multi-user apps"
            value={tagline}
            onChange={(e) => {
              setTagline(e.target.value);
              if (errors.tagline) setErrors((prev) => ({ ...prev, tagline: '' }));
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-[var(--canvas)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all ${
              errors.tagline ? 'border-rose-500' : 'border-[var(--border-default)]'
            }`}
          />
          {errors.tagline ? (
            <p className="text-[11px] text-rose-500 font-medium">{errors.tagline}</p>
          ) : (
            <p className="text-[11px] text-[var(--text-muted)]">
              A single punchy sentence describing what it is and what core problem it solves.
            </p>
          )}
        </div>

        {/* 3. Category */}
        <div className="space-y-1.5">
          <label htmlFor="project-category" className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
            <span>Category</span>
            <span className="text-rose-500">*</span>
          </label>
          <select
            id="project-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProjectCategory)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all cursor-pointer"
          >
            {APPROVED_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label} — {cat.desc}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Optional Initial Description */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="project-description" className="font-bold text-[var(--text-primary)]">
              Initial Context / Overview <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
            </label>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">{description.length} chars</span>
          </div>
          <textarea
            id="project-description"
            rows={4}
            placeholder="Briefly describe the architectural approach, key technical trade-offs, or questions you want feedback on..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all"
          />
          <p className="text-[11px] text-[var(--text-muted)]">
            You can expand this with full markdown specifications, architecture diagrams, and requirements in the Project Setup view.
          </p>
        </div>

        {/* 5. Repository & Demo Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-default)]">
          <div className="space-y-1.5">
            <label htmlFor="project-repo" className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Repository URL</span>
            </label>
            <input
              id="project-repo"
              type="url"
              placeholder="https://github.com/org/repo"
              value={repositoryUrl}
              onChange={(e) => {
                setRepositoryUrl(e.target.value);
                if (errors.repositoryUrl) setErrors((prev) => ({ ...prev, repositoryUrl: '' }));
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs border bg-[var(--canvas)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                errors.repositoryUrl ? 'border-rose-500' : 'border-[var(--border-default)]'
              }`}
            />
            {errors.repositoryUrl && <p className="text-[11px] text-rose-500">{errors.repositoryUrl}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-demo" className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Live Prototype URL</span>
            </label>
            <input
              id="project-demo"
              type="url"
              placeholder="https://demo.example.com"
              value={demoUrl}
              onChange={(e) => {
                setDemoUrl(e.target.value);
                if (errors.demoUrl) setErrors((prev) => ({ ...prev, demoUrl: '' }));
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs border bg-[var(--canvas)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                errors.demoUrl ? 'border-rose-500' : 'border-[var(--border-default)]'
              }`}
            />
            {errors.demoUrl && <p className="text-[11px] text-rose-500">{errors.demoUrl}</p>}
          </div>
        </div>

        {/* 6. Form Submission Footer */}
        <div className="pt-4 border-t border-[var(--border-default)] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link to="/personal">
            <Button variant="outline" size="md" type="button" disabled={isSubmitting} className="w-full sm:w-auto">
              Cancel
            </Button>
          </Link>

          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto font-bold shadow-sm"
          >
            {isSubmitting ? 'Creating Project...' : 'Create Project & Continue to Setup'}
          </Button>
        </div>
      </form>
    </div>
  );
};
