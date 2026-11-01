import React, { useState } from 'react';
import {
  ChevronUp,
  Reply,
  CheckCircle2,
  ChevronDown,
  CornerDownRight,
  Flag,
  Share2,
  Check,
} from 'lucide-react';
import type { Comment } from '../../types';
import { Badge } from '../common/Badge';
import { CommentComposer } from './CommentComposer';
import { formatTimeAgo } from '../../lib/utils';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface CommentThreadProps {
  comment: Comment;
  postId: string;
  onAddReply: (content: string, isAnonymous: boolean, parentCommentId: string) => Promise<void>;
  depth?: number;
  postAuthorId?: string;
  onReport?: (commentId: string) => void;
}

// Aragón et al. (2017): Bounded visual depth to eliminate horizontal staircase collapse
const MAX_VISUAL_DEPTH = 2;

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  postId,
  onAddReply,
  depth = 0,
  postAuthorId,
  onReport,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [upvotes, setUpvotes] = useState(comment.upvotesCount);
  const [hasUpvoted, setHasUpvoted] = useState(comment.userHasUpvoted || false);
  const [isReplying, setIsReplying] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isOP = Boolean(postAuthorId && comment.author?.id && comment.author.id === postAuthorId);
  const isFlattened = depth > MAX_VISUAL_DEPTH;
  const replyCount = comment.replies?.length || 0;

  const handleVote = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (isVoting) return;
    setIsVoting(true);
    const prev = upvotes;
    const prevStatus = hasUpvoted;

    // Optimistic UI update
    setUpvotes((p) => (hasUpvoted ? p - 1 : p + 1));
    setHasUpvoted(!hasUpvoted);

    try {
      const res = await api.toggleUpvoteComment(comment.id);
      setUpvotes(res.upvotesCount);
      setHasUpvoted(res.userHasUpvoted);
    } catch {
      setUpvotes(prev);
      setHasUpvoted(prevStatus);
    } finally {
      setIsVoting(false);
    }
  };

  const handleReplySubmit = async (
    content: string,
    isAnonymous: boolean,
    parentCommentId?: string
  ) => {
    if (!parentCommentId) return;
    await onAddReply(content, isAnonymous, parentCommentId);
    setIsReplying(false);
  };

  const handleSharePermalink = async () => {
    try {
      const url = `${window.location.origin}/posts/${postId}#comment-${comment.id}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Compute indentation classes: bounded depth prevents mobile staircase collapse
  const indentClass =
    depth === 0
      ? ''
      : depth === 1
      ? 'ml-3 sm:ml-5 pl-3 sm:pl-4 border-l-2 border-[var(--border-subtle)]'
      : depth === 2
      ? 'ml-3 sm:ml-5 pl-3 sm:pl-4 border-l-2 border-[var(--border-subtle)]'
      : 'ml-1 sm:ml-2 pl-2 sm:pl-3 border-l-2 border-indigo-300 dark:border-indigo-800';

  return (
    <div
      id={`comment-${comment.id}`}
      className={`relative group ${indentClass} transition-all`}
    >
      <div className="py-3 transition-colors">
        {/* Author Header & Social Translucence (Erickson & Kellogg, 2000) */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {comment.isAnonymous ? (
              <Badge variant="anonymous" size="sm" icon>
                Anonymous Reviewer
              </Badge>
            ) : (
              <div className="flex items-center gap-1.5">
                {comment.author?.avatarUrl ? (
                  <img
                    src={comment.author.avatarUrl}
                    alt={comment.author.displayName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[10px] flex items-center justify-center font-bold text-[var(--text-primary)]">
                    {comment.author?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="font-bold text-[var(--text-primary)]">
                  {comment.author?.displayName}
                </span>

                {/* Social Translucence: OP Badge */}
                {isOP && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Product Owner
                  </span>
                )}

                {/* Reputation score */}
                {typeof comment.author?.reputationScore === 'number' && (
                  <span
                    className="text-[10px] text-[var(--text-muted)] font-mono"
                    title="Community Reputation"
                  >
                    ★ {comment.author.reputationScore}
                  </span>
                )}
              </div>
            )}

            {/* Bounded threading: Flattened depth indicator pill */}
            {isFlattened && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                <CornerDownRight className="w-2.5 h-2.5 text-indigo-500" />
                depth {depth}
              </span>
            )}

            <span className="text-[var(--text-muted)]">·</span>
            <span className="text-[var(--text-muted)]">{formatTimeAgo(comment.createdAt)}</span>

            {comment.isHelpfulFlag && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                Helpful Review
              </span>
            )}
          </div>

          {/* Thread collapse & Report actions */}
          <div className="flex items-center gap-1">
            {replyCount > 0 && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? `Expand ${replyCount} replies` : 'Collapse replies'}
                className="px-2 py-0.5 rounded text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-1 cursor-pointer"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
                )}
                <span>{isCollapsed ? `+${replyCount} replies` : 'collapse'}</span>
              </button>
            )}

            <button
              onClick={handleSharePermalink}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Copy link to comment"
              aria-label="Copy permalink"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>

            {onReport && (
              <button
                onClick={() => onReport(comment.id)}
                className="text-[var(--text-muted)] hover:text-rose-500 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Report inappropriate content"
                aria-label="Report comment"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Comment Body (Hidden when collapsed) */}
        {!isCollapsed && (
          <>
            <div className="text-xs sm:text-sm text-[var(--text-primary)]/90 leading-relaxed whitespace-pre-line pl-0.5 mb-2.5">
              {comment.content}
            </div>

            {/* Comment Actions & Tactile Neomorphic Voting */}
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <button
                onClick={handleVote}
                disabled={isVoting}
                role="button"
                aria-pressed={hasUpvoted}
                aria-label={
                  hasUpvoted
                    ? `Remove upvote from comment (${upvotes} votes)`
                    : `Upvote comment (${upvotes} votes)`
                }
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  hasUpvoted
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 font-bold neomorph-inset'
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-slate-300 dark:hover:border-slate-700 neomorph-pill'
                }`}
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>{upvotes}</span>
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal('login');
                    return;
                  }
                  setIsReplying(!isReplying);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer font-medium"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>{isReplying ? 'Cancel' : 'Reply'}</span>
              </button>
            </div>

            {/* Inline reply composer */}
            {isReplying && (
              <div className="mt-3.5">
                <CommentComposer
                  postId={postId}
                  parentCommentId={comment.id}
                  replyingToAuthor={
                    comment.isAnonymous ? 'Anonymous Reviewer' : comment.author?.displayName
                  }
                  onSubmit={handleReplySubmit}
                  onCancelReply={() => setIsReplying(false)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Recursive children replies (if not collapsed) */}
      {!isCollapsed && comment.replies && comment.replies.length > 0 && (
        <div className="space-y-1">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              onAddReply={onAddReply}
              depth={depth + 1}
              postAuthorId={postAuthorId}
              onReport={onReport}
            />
          ))}
        </div>
      )}
    </div>
  );
};
