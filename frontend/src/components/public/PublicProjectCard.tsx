import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  GitBranch,
  ArrowRight,
  User,
  ChevronUp,
} from 'lucide-react';
import type { PublicProject } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { playHapticPop } from '../../lib/haptics';

interface PublicProjectCardProps {
  project: PublicProject;
  onUpvoteChange?: (projectId: string, upvotesCount: number, hasUpvoted?: boolean) => void;
}

export const PublicProjectCard: React.FC<PublicProjectCardProps> = ({
  project,
  onUpvoteChange,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [upvotes, setUpvotes] = useState(project.upvotesCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    const willUpvote = !hasUpvoted;
    playHapticPop(willUpvote ? 620 : 380);

    const prevCount = upvotes;
    const prevStatus = hasUpvoted;
    const nextCount = willUpvote ? prevCount + 1 : Math.max(0, prevCount - 1);

    setUpvotes(nextCount);
    setHasUpvoted(willUpvote);
    onUpvoteChange?.(project.id, nextCount, willUpvote);

    try {
      const res = await api.upvotePublicProject(project.id);
      if (res && typeof res.upvotesCount === 'number') {
        setUpvotes(res.upvotesCount);
        setHasUpvoted(Boolean(res.hasUpvoted));
        onUpvoteChange?.(project.id, res.upvotesCount, Boolean(res.hasUpvoted));
      }
    } catch {
      // Revert if request failed
      setUpvotes(prevCount);
      setHasUpvoted(prevStatus);
      onUpvoteChange?.(project.id, prevCount, prevStatus);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="relative flex flex-col justify-between h-full p-5 sm:p-6 rounded-2xl border border-[var(--border-default)]/80 bg-[var(--surface)]/70 backdrop-blur-md hover:border-[var(--accent)]/50 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_32px_rgba(59,130,246,0.08)] hover:-translate-y-1 transition-all duration-300 group">
      <div className="space-y-3.5">
        {/* Top Header: Identity, Category & Interactive Upvote Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:border-[var(--accent)]/40 transition-colors">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <Link
                to={`/public/projects/${project.id}`}
                className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate block"
              >
                {project.name}
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                <span className="capitalize">{project.category.replace(/-/g, ' ')}</span>
                {project.creatorDisplayName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate">
                      <User className="w-3 h-3 text-[var(--text-muted)]" />
                      {project.creatorDisplayName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Liquid Upvote Pill */}
          <button
            type="button"
            onClick={handleVote}
            disabled={isVoting}
            aria-label={hasUpvoted ? 'Remove upvote' : 'Upvote project'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-semibold cursor-pointer shrink-0 ${
              hasUpvoted
                ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-xs'
                : 'bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]'
            }`}
          >
            <ChevronUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'stroke-[2.5]' : ''}`} />
            <span>{upvotes}</span>
          </button>
        </div>

        {/* Tagline / Brief Statement */}
        {project.tagline && (
          <p className="text-xs font-medium text-[var(--text-secondary)] line-clamp-1 leading-normal">
            {project.tagline}
          </p>
        )}

        {/* Description Excerpt */}
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
          {project.description || 'No detailed architecture description provided.'}
        </p>

        {/* Consistent Liquid Status & External Source Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
          {project.reviewsCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border-default)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{project.reviewsCount} {project.reviewsCount === 1 ? 'Review' : 'Reviews'} Verified</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-raised)] text-[var(--text-muted)] border border-[var(--border-default)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]/50" />
              <span>Open for Feedback</span>
            </span>
          )}

          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/40 transition-colors border border-[var(--border-default)]"
            >
              <GitBranch className="w-3 h-3 text-[var(--text-muted)]" />
              <span>Code</span>
            </a>
          )}

          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/40 transition-colors border border-[var(--border-default)]"
            >
              <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
              <span>Demo</span>
            </a>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="pt-3.5 mt-4 border-t border-[var(--border-default)]/60 flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-muted)]">
          Stage: <span className="capitalize font-medium text-[var(--text-secondary)]">{project.status}</span>
        </span>

        <Link
          to={`/public/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline group-hover:translate-x-0.5 transition-transform"
        >
          <span>Explore Findings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

