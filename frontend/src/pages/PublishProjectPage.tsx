import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GitBranch,
  ExternalLink,
  ChevronLeft,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { api } from '../services/api';
import type { ProjectCategory } from '../types';
import { Button } from '../components/common/Button';

const CATEGORIES: { id: ProjectCategory; label: string; desc: string }[] = [
  { id: 'developer-tools', label: 'Developer Tools', desc: 'SDKs, CLIs, libraries, debuggers, git engines' },
  { id: 'productivity', label: 'Productivity', desc: 'Task planners, notes, workflow automation, calendars' },
  { id: 'ai-ml', label: 'AI & Machine Learning', desc: 'LLM agents, inference, RAG tools, generative models' },
  { id: 'design-ux', label: 'Design & UX', desc: 'Design systems, UI kits, prototyping tools' },
  { id: 'saas-b2b', label: 'Business & SaaS', desc: 'Analytics, CRM, invoicing, metrics, automation' },
  { id: 'mobile', label: 'Mobile Apps', desc: 'Android APKs, iOS, multi-platform applications' },
  { id: 'infrastructure', label: 'Infrastructure', desc: 'Databases, networking, cloud platforms, security' },
];

export const PublishProjectPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('developer-tools');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 3) {
      setError('Project name must be at least 3 characters.');
      return;
    }
    if (tagline.trim().length < 10) {
      setError('Tagline must be at least 10 characters to clearly explain your product.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createProject({
        name: name.trim(),
        tagline: tagline.trim(),
        category,
        description: description.trim(),
        repositoryUrl: repositoryUrl.trim() || undefined,
        demoUrl: demoUrl.trim() || undefined,
        isPublic,
      });

      // Clear any temporary draft
      localStorage.removeItem('pri_new_project_draft');

      // Navigate to the newly published project detail page
      navigate(`/projects/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to publish project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Explore</span>
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
          <Plus className="w-4 h-4" />
          <span>Product Launch</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Publish Your Application
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Introduce your application to the FeedbackAI community, start a dedicated discussion hub, and optionally distribute verified Android APK builds.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Publishing Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] shadow-xs space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
            Project / Application Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. NeuroFlow Canvas"
            required
            className="w-full px-4 py-3 text-sm rounded-xl border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)]"
          />
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
            Tagline / Value Proposition *
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. Interactive WebGL node graph for debugging multi-agent reasoning systems"
            required
            className="w-full px-4 py-3 text-sm rounded-xl border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)]"
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            A concise one-liner displayed on product cards and search results.
          </p>
        </div>

        {/* Domain Category */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
            Domain Category *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  category === cat.id
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)] ring-1 ring-[var(--accent)]'
                    : 'border-[var(--border-default)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]'
                }`}
              >
                <p className="text-xs font-bold text-[var(--text-primary)]">{cat.label}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Full Description */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
            Detailed Description & Architecture
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what problem your product solves, current stage, intended audience, and what specific feedback you are seeking from builders..."
            rows={5}
            className="w-full px-4 py-3 text-sm rounded-xl border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] resize-y"
          />
        </div>

        {/* External Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-default)]/60">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Repository URL (Optional)</span>
            </label>
            <input
              type="url"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              placeholder="https://github.com/username/project"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Demo / Website URL (Optional)</span>
            </label>
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://yourapp.example.com"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)]"
            />
          </div>
        </div>

        {/* Public Visibility Toggle */}
        <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-raised)]/30 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-[var(--text-primary)]">
              List on Public Community Feed
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Allows builders to discover your project, participate in discussions, and try out releases.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--border-default)] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
          </label>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-default)]/60">
          <Link to="/explore">
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-xs font-semibold shadow-xs"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Project'}
          </Button>
        </div>
      </form>
    </div>
  );
};
