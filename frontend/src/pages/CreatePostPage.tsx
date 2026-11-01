import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  UserX,
  Globe,
  AlertCircle,
  ArrowLeft,
  Send,
  Eye,
  Edit3,
  CheckCircle2,
  Trash2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { FeedbackCategory, PostType, Post } from '../types';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

const CATEGORIES: FeedbackCategory[] = [
  'Productivity',
  'Developer Tools',
  'AI & Machine Learning',
  'Design & UX',
  'SaaS & B2B',
  'Mobile Apps',
];

const POST_TYPES: { id: PostType; label: string; desc: string }[] = [
  { id: 'product_review', label: 'Product Review', desc: 'Request honest feedback on a working product or MVP' },
  { id: 'idea_critique', label: 'Idea Critique', desc: 'Validate an architectural concept, workflow, or thesis' },
  { id: 'problem_discovery', label: 'Problem Discovery', desc: 'Investigate if a problem hurts other teams before building' },
  { id: 'general_feedback', label: 'General Feedback', desc: 'Open discussion and community advice' },
];

const DRAFT_KEY = 'pri_draft_post';

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, openAuthModal } = useAuth();

  const queryProductUrl = searchParams.get('productUrl') || '';
  const queryCategory = searchParams.get('category') as FeedbackCategory | null;

  // Load initial draft from localStorage if available
  const savedDraft = useMemo(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [title, setTitle] = useState(savedDraft?.title || '');
  const [description, setDescription] = useState(savedDraft?.description || '');
  const [category, setCategory] = useState<FeedbackCategory>(
    queryCategory || savedDraft?.category || 'Productivity'
  );
  const [postType, setPostType] = useState<PostType>(savedDraft?.postType || 'product_review');
  const [productUrl, setProductUrl] = useState(queryProductUrl || savedDraft?.productUrl || '');
  const [tagsInput, setTagsInput] = useState(savedDraft?.tagsInput || '');
  const [isAnonymous, setIsAnonymous] = useState(savedDraft?.isAnonymous || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(Boolean(savedDraft?.title || savedDraft?.description));
  const [previewMode, setPreviewMode] = useState(false);

  // Ribeiro et al. (2025) Post Guidance & Duplicate Suggestions
  const [existingPosts, setExistingPosts] = useState<Post[]>([]);

  useEffect(() => {
    api.getPosts('All', 'recent')
      .then((data) => setExistingPosts(data.slice(0, 30)))
      .catch(() => {});
  }, []);

  // Auto-save draft on changes
  useEffect(() => {
    if (title || description || productUrl) {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          title,
          description,
          category,
          postType,
          productUrl,
          tagsInput,
          isAnonymous,
          savedAt: new Date().toISOString(),
        })
      );
    }
  }, [title, description, category, postType, productUrl, tagsInput, isAnonymous]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle('');
    setDescription('');
    setProductUrl('');
    setTagsInput('');
    setIsAnonymous(false);
    setDraftRestored(false);
  };

  // Duplicate detection suggestions
  const duplicateSuggestions = useMemo(() => {
    if (!title.trim() || title.trim().length < 6) return [];
    const qWords = title
      .toLowerCase()
      .split(/\s+/)
      .filter((w: string) => w.length > 3);
    if (qWords.length === 0) return [];

    return existingPosts
      .filter((p) => {
        const pTitle = p.title.toLowerCase();
        const matchCount = qWords.filter((w: string) => pTitle.includes(w)).length;
        return matchCount >= 2 || (qWords.length === 1 && pTitle.includes(qWords[0]));
      })
      .slice(0, 3);
  }, [title, existingPosts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters to provide sufficient context for reviewers.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    setIsSubmitting(true);
    try {
      const created = await api.createPost({
        title: title.trim(),
        description: description.trim(),
        category,
        postType,
        productUrl: productUrl.trim() || undefined,
        tags: tags.length > 0 ? tags : [category],
        isAnonymous,
      });
      // Clear draft on successful publication
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/posts/${created.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create discussion. Your draft has been preserved.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {draftRestored && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-medium">Draft auto-saved</span>
            <button
              onClick={clearDraft}
              title="Discard draft"
              className="text-[var(--text-muted)] hover:text-rose-500 ml-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mb-1.5">
          Start a Product Discussion
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]">
          Request unvarnished constructive criticism from founders and engineers.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="neomorph-card p-6 sm:p-7 space-y-5">
          {/* Objective Type Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Discussion Intent
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {POST_TYPES.map((pt) => {
                const isSelected = postType === pt.id;
                return (
                  <button
                    type="button"
                    key={pt.id}
                    onClick={() => setPostType(pt.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/40 neomorph-inset'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-[var(--text-primary)] mb-0.5">
                      {pt.label}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] leading-snug">
                      {pt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Duplicate Guidance (Ribeiro et al., 2025) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Title <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] ${
                  title.length < 5
                    ? 'text-[var(--text-muted)]'
                    : title.length > 120
                    ? 'text-rose-500 font-semibold'
                    : 'text-emerald-600 dark:text-emerald-400 font-medium'
                }`}
              >
                {title.length}/120 characters (min 5)
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ReflectTask: Keyboard-first daily task planner. Looking for onboarding and sync critiques."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />

            {/* Ribeiro et al. 2025 Gentle Duplicate Suggestion Box */}
            {duplicateSuggestions.length > 0 && (
              <div className="mt-2.5 p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs">
                <div className="font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Similar discussions found:
                </div>
                <ul className="space-y-1 text-[var(--text-primary)] pl-4 list-disc">
                  {duplicateSuggestions.map((dp) => (
                    <li key={dp.id}>
                      <Link
                        to={`/posts/${dp.id}`}
                        target="_blank"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        {dp.title} <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                      <span className="text-[var(--text-muted)] text-[11px] ml-1">
                        ({dp.commentsCount} comments)
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1.5">
                  Consider joining an existing thread if your question aligns.
                </p>
              </div>
            )}
          </div>

          {/* Category & Product URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Product / Demo Website (Optional)
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Description with Edit / Preview Mode */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Description & Questions for Reviewers <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1 border border-[var(--border-subtle)] rounded-xl p-0.5 text-xs bg-[var(--bg-secondary)]">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-semibold ${
                    !previewMode
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-semibold ${
                    previewMode
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
              </div>
            </div>

            {!previewMode ? (
              <textarea
                required
                rows={7}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Structure your critique request:&#10;1. Core Problem: What problem does this solve and for whom?&#10;2. Key Features: Bullet points describing capabilities&#10;3. Specific Critique Requests: Where do you want honest community feedback?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-sans"
              />
            ) : (
              <div className="min-h-[160px] p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                {description.trim() ? (
                  description
                ) : (
                  <span className="text-[var(--text-muted)] italic">No description to preview yet.</span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mt-1">
              <span>Supports bullet points, features, and markdown notes.</span>
              <span
                className={
                  description.length >= 20
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'text-[var(--text-muted)]'
                }
              >
                {description.length} characters (min 20)
              </span>
            </div>
          </div>

          {/* Topic Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Topic Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Local-First, SQLite, Onboarding, Freemium, CLI"
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Anonymity Choice & Social Accountability */}
          <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-1 rounded border-[var(--border-subtle)] text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-indigo-500" />
                  Publish with Anonymous Contributor Badge
                </span>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-0.5">
                  Your identity and username remain concealed on the public post. You retain author editing permissions and the ability to access the Creator Research Studio.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={clearDraft}
            className="text-xs font-semibold text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
          >
            Discard Draft
          </button>

          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              rightIcon={<Send className="w-4 h-4" />}
            >
              Publish Discussion
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
