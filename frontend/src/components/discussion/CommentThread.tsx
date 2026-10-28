import React, { useState } from 'react';
import {
  ChevronUp,
  Reply,
  CheckCircle2,
  MoreHorizontal,
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
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  postId,
  onAddReply,
  depth = 0,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [upvotes, setUpvotes] = useState(comment.upvotesCount);
  const [hasUpvoted, setHasUpvoted] = useState(comment.userHasUpvoted || false);
  const [isReplying, setIsReplying] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (isVoting) return;
    setIsVoting(true);
    const prev = upvotes;
    const prevStatus = hasUpvoted;

    // Optimistic
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

  return (
    <div
      id={`comment-${comment.id}`}
      className={`relative group ${depth > 0 ? 'ml-3 sm:ml-6 pl-3 sm:pl-4 border-l border-slate-200 dark:border-slate-800' : ''}`}
    >
      <div className="py-3 transition-colors">
        {/* Author Header */}
        <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
          <div className="flex items-center gap-2">
            {comment.isAnonymous ? (
              <Badge variant="anonymous" size="sm" icon>
                Anonymous Reviewer
              </Badge>
            ) : (
              <div className="flex items-center gap-1.5">
                {comment.author.avatarUrl ? (
                  <img
                    src={comment.author.avatarUrl}
                    alt={comment.author.displayName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center font-bold">
                    {comment.author.displayName.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {comment.author.displayName}
                </span>
                {comment.author.reputationScore !== undefined && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    [{comment.author.reputationScore}]
                  </span>
                )}
              </div>
            )}

            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              {formatTimeAgo(comment.createdAt)}
            </span>

            {comment.isHelpfulFlag && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Helpful
              </span>
            )}
          </div>

          <button
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity p-1"
            title="Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Comment Body */}
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pl-0.5 mb-2">
          {comment.content}
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <button
            onClick={handleVote}
            disabled={isVoting}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
              hasUpvoted
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 font-semibold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200'
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
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>
        </div>

        {/* Inline reply composer */}
        {isReplying && (
          <div className="mt-3">
            <CommentComposer
              postId={postId}
              parentCommentId={comment.id}
              replyingToAuthor={
                comment.isAnonymous ? 'Anonymous Reviewer' : comment.author.displayName
              }
              onSubmit={handleReplySubmit}
              onCancelReply={() => setIsReplying(false)}
            />
          </div>
        )}
      </div>

      {/* Recursive children replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-1">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              onAddReply={onAddReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
