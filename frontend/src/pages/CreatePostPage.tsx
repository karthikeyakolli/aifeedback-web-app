import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserX, Globe, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import type { FeedbackCategory, PostType } from '../types';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

const CATEGORIES: FeedbackCategory[] = [
  'Productivity',
  'Developer Tools',
  'AI & Machine Learning',
  'Design & UX',
  'SaaS & B2B',
  'Mobile Apps',
];

const POST_TYPES: { id: PostType; label: string; desc: string }[] = [
  { id: 'product_review', label: 'Product Review', desc: 'Request honest feedback on a working product' },
  { id: 'idea_critique', label: 'Idea Critique', desc: 'Validate an architectural concept or hypothesis' },
  { id: 'problem_discovery', label: 'Problem Discovery', desc: 'Investigate whether a problem hurts other teams' },
  { id: 'general_feedback', label: 'General Feedback', desc: 'Open discussion and community advice' },
];

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('Productivity');
  const [postType, setPostType] = useState<PostType>('product_review');
  const [productUrl, setProductUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters to provide sufficient context for reviews.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

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
      navigate(`/posts/${created.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create post');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5">
          Publish a Review Request
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gather authentic community critique. Anonymous posting is supported and respected.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5 sm:p-6 space-y-5">
          {/* Post Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Review Objective
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {POST_TYPES.map((pt) => {
                const isSelected = postType === pt.id;
                return (
                  <button
                    type="button"
                    key={pt.id}
                    onClick={() => setPostType(pt.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 mb-0.5">
                      {pt.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {pt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ReflectTask: Keyboard-first daily task planner. Looking for onboarding feedback."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Category & Product URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111625] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Product / Demo URL (Optional)
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Description & Review Request */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Description & Questions for Reviewers <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product, who it is for, and 2-3 specific questions you want reviewers to answer..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Constructive, specific questions yield significantly higher-quality feedback and clearer AI research themes.
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Topic Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Local-First, SQLite, Onboarding, Pricing"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Anonymity Choice */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-1 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-slate-500" />
                  Publish with Anonymous Public Display
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  Your username and profile will be hidden from public viewers. Your private account remains accountable internally for edit control and abuse moderation.
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            rightIcon={<Send className="w-4 h-4" />}
          >
            Publish Discussion
          </Button>
        </div>
      </form>
    </div>
  );
};
