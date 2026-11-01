import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronUp,
  MessageSquare,
  Sparkles,
  Bookmark,
  ExternalLink,
  Package,
  Share2,
  Check,
} from 'lucide-react';
import type { Post } from '../../types';
import { Badge } from '../common/Badge';
import { formatTimeAgo } from '../../lib/utils';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface PostCardProps {
  post: Post;
  onPostUpdated?: (updated: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [upvotes, setUpvotes] = useState(post.upvotesCount);
  const [hasUpvoted, setHasUpvoted] = useState(post.userHasUpvoted || false);
  const [hasBookmarked, setHasBookmarked] = useState(post.userHasBookmarked || false);
  const [isVoting, setIsVoting] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const isOwner = Boolean(user && post.author?.id && user.id === post.author.id);

  // Extract clean product name if title is structured "Product: description"
  const productName = post.title.includes(':')
    ? post.title.split(':')[0].trim()
    : post.title.includes(' - ')
    ? post.title.split(' - ')[0].trim()
    : null;

  const domain = post.productUrl
    ? post.productUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : null;

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (isVoting) return;
    setIsVoting(true);

    const prevVotes = upvotes;
    const prevStatus = hasUpvoted;

    // Optimistic update
    setUpvotes((prev) => (hasUpvoted ? prev - 1 : prev + 1));
    setHasUpvoted(!hasUpvoted);

    try {
      const res = await api.toggleUpvotePost(post.id);
      setUpvotes(res.upvotesCount);
      setHasUpvoted(res.userHasUpvoted);
    } catch {
      // Revert on error
      setUpvotes(prevVotes);
      setHasUpvoted(prevStatus);
    } finally {
      setIsVoting(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const prev = hasBookmarked;
    setHasBookmarked(!prev);
    try {
      const res = await api.toggleBookmarkPost(post.id);
      setHasBookmarked(res.userHasBookmarked);
    } catch {
      setHasBookmarked(prev);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/posts/${post.id}`;
      await navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="neomorph-card p-4 sm:p-5 flex gap-3 sm:gap-4 transition-all hover:border-indigo-400/50 dark:hover:border-indigo-500/50 group">
      {/* Upvote Pill (Tactile Neomorphic Control) */}
      <div className="flex flex-col items-center shrink-0">
        <button
          onClick={handleVote}
          disabled={isVoting}
          role="button"
          aria-pressed={hasUpvoted}
          aria-label={
            hasUpvoted
              ? `Remove upvote from "${post.title}"`
              : `Upvote "${post.title}" (${upvotes} votes)`
          }
          className={`flex flex-col items-center justify-center w-12 py-2.5 rounded-xl border transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] ${
            hasUpvoted
              ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-600 dark:text-indigo-400 font-bold neomorph-inset'
              : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-slate-300 dark:hover:border-slate-700 neomorph-pill'
          }`}
        >
          <ChevronUp
            className={`w-4 h-4 transition-transform ${
              hasUpvoted ? 'translate-y-[-1px] stroke-[2.5]' : ''
            }`}
          />
          <span className="text-xs font-bold leading-none mt-1">{upvotes}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Post Metadata Header */}
        <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
          {/* Product Profile Tag (If Available) */}
          {productName && (
            <Link
              to={`/products/${post.id}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
              title={`View ${productName} Product Profile`}
            >
              <Package className="w-3 h-3" />
              <span>{productName}</span>
            </Link>
          )}

          <Badge variant="outline" size="sm">
            {post.category}
          </Badge>

          {post.isAnonymous ? (
            <Badge variant="anonymous" size="sm" icon>
              Anonymous Contributor
            </Badge>
          ) : (
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.displayName}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700" />
              )}
              <span className="font-medium text-[var(--text-primary)]">
                {post.author.displayName}
              </span>
              {typeof post.author.reputationScore === 'number' && post.author.reputationScore > 0 && (
                <span
                  className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                  title="Community Reputation Score"
                >
                  ★ {post.author.reputationScore}
                </span>
              )}
            </div>
          )}

          {post.status === 'locked' && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              Locked Discussion
            </span>
          )}

          <span className="text-[var(--text-muted)]">·</span>
          <span className="text-[var(--text-muted)]">{formatTimeAgo(post.createdAt)}</span>

          {post.productUrl && domain && (
            <>
              <span className="text-[var(--text-muted)]">·</span>
              <a
                href={post.productUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-[140px]"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{domain}</span>
              </a>
            </>
          )}
        </div>

        {/* Discussion Title */}
        <Link to={`/posts/${post.id}`} className="group/title block">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover/title:text-indigo-600 dark:group-hover/title:text-indigo-400 transition-colors leading-snug mb-1.5">
            {post.title}
          </h2>
        </Link>

        {/* Content Preview */}
        <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-3">
          {post.description}
        </p>

        {/* Topic Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions & Real Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[var(--border-subtle)] text-xs">
          <div className="flex items-center gap-3">
            {/* Comments Counter & Navigation */}
            <Link
              to={`/posts/${post.id}`}
              className="inline-flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-semibold"
            >
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <span>
                {post.commentsCount} {post.commentsCount === 1 ? 'review' : 'reviews'}
              </span>
            </Link>

            {/* Owner Workspace vs. Grounded Evidence Indicator */}
            {isOwner ? (
              <Link
                to={`/posts/${post.id}?tab=insights`}
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-2 py-0.5 rounded-md font-semibold text-[11px] border border-indigo-200 dark:border-indigo-800 transition-colors"
                title="Open your private Creator Research Studio"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>My Research Studio</span>
              </Link>
            ) : post.hasAiAnalysis ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Grounded Evidence</span>
              </span>
            ) : null}
          </div>

          {/* Secondary Actions: Share & Bookmark */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              role="button"
              aria-label="Share discussion link"
              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
              title="Copy share link"
            >
              {copiedShare ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleBookmark}
              role="button"
              aria-pressed={hasBookmarked}
              aria-label={
                hasBookmarked ? `Remove bookmark for "${post.title}"` : `Bookmark "${post.title}"`
              }
              className={`p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                hasBookmarked
                  ? 'text-amber-500 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
              title={hasBookmarked ? 'Saved to bookmarks' : 'Save discussion'}
            >
              <Bookmark className={`w-4 h-4 ${hasBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
