import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  ChevronUp,
  Sparkles,
  GitBranch,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import type { PublicProject } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

interface PublicProjectCardProps {
  project: PublicProject;
  onUpvoteChange?: (projectId: string, upvotesCount: number, hasUpvoted: boolean) => void;
}

export const PublicProjectCard: React.FC<PublicProjectCardProps> = ({
  project,
  onUpvoteChange,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [upvotesCount, setUpvotesCount] = useState(project.upvotesCount);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (isUpvoting) return;
    setIsUpvoting(true);

    // Optimistic calculation
    const nextHasUpvoted = !hasUpvoted;
    const nextCount = nextHasUpvoted ? upvotesCount + 1 : Math.max(0, upvotesCount - 1);
    setUpvotesCount(nextCount);
    setHasUpvoted(nextHasUpvoted);

    try {
      const res = await api.upvotePublicProject(project.id);
      setUpvotesCount(res.upvotesCount);
      setHasUpvoted(res.hasUpvoted);
      if (onUpvoteChange) {
        onUpvoteChange(project.id, res.upvotesCount, res.hasUpvoted);
      }
    } catch (err) {
      // Revert optimistic state
      setUpvotesCount(upvotesCount);
      setHasUpvoted(hasUpvoted);
      console.error('Failed to upvote project:', err);
    } finally {
      setIsUpvoting(false);
    }
  };

  const getGradient = (name: string) => {
    const gradients = [
      'from-indigo-500 to-sky-600',
      'from-blue-600 to-teal-500',
      'from-emerald-500 to-cyan-600',
      'from-violet-600 to-indigo-600',
      'from-amber-500 to-orange-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="flex flex-col justify-between h-full p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)] hover:shadow-md transition-all duration-200 group">
      <div className="space-y-4">
        {/* Top Header: Identity, Category & Upvote Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-extrabold text-base shadow-xs shrink-0',
                getGradient(project.name)
              )}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <Link
                to={`/public/projects/${project.id}`}
                className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate block"
              >
                {project.name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                <span className="capitalize">{project.category.replace(/-/g, ' ')}</span>
                {project.creatorDisplayName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate">
                      <User className="w-3 h-3" />
                      {project.creatorDisplayName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Upvote Pill */}
          <button
            type="button"
            onClick={handleUpvote}
            disabled={isUpvoting}
            aria-label={`Upvote ${project.name}, current count ${upvotesCount}`}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer',
              hasUpvoted
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
            )}
          >
            <ChevronUp className={cn('w-4 h-4', hasUpvoted ? 'text-white' : 'text-[var(--text-muted)]')} />
            <span>{upvotesCount}</span>
          </button>
        </div>

        {/* Tagline / Brief Problem Statement */}
        {project.tagline && (
          <p className="text-xs font-semibold text-[var(--text-secondary)] line-clamp-1">
            {project.tagline}
          </p>
        )}

        {/* Description Excerpt */}
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
          {project.description || 'No detailed architecture description provided.'}
        </p>

        {/* Verified AI Feedback & Status Meta */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
          {project.reviewsCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              <span>{project.reviewsCount} AI {project.reviewsCount === 1 ? 'Review' : 'Reviews'} Verified</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              <span>Review Pending</span>
            </span>
          )}

          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)]"
            >
              <GitBranch className="w-3 h-3" />
              <span>Repository</span>
            </a>
          )}

          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-default)]"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Demo</span>
            </a>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="pt-4 mt-4 border-t border-[var(--border-default)] flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-muted)]">
          Stage: <span className="capitalize font-semibold text-[var(--text-secondary)]">{project.status}</span>
        </span>

        <Link
          to={`/public/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:underline"
        >
          <span>Inspect Project & Findings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

