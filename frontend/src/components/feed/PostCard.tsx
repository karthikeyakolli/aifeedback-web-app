import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronUp,
  MessageSquare,
  Sparkles,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import type { Post } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { formatTimeAgo } from '../../lib/utils';
import { api } from '../../services/api';

interface PostCardProps {
  post: Post;
  onPostUpdated?: (updated: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [upvotes, setUpvotes] = useState(post.upvotesCount);
  const [hasUpvoted, setHasUpvoted] = useState(post.userHasUpvoted || false);
  const [hasBookmarked, setHasBookmarked] = useState(post.userHasBookmarked || false);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    } catch (err) {
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
    const prev = hasBookmarked;
    setHasBookmarked(!prev);
    try {
      const res = await api.toggleBookmarkPost(post.id);
      setHasBookmarked(res.userHasBookmarked);
    } catch {
      setHasBookmarked(prev);
    }
  };

  return (
    <Card hoverable className="p-4 sm:p-5 flex gap-3 sm:gap-4 transition-all">
      {/* Upvote Pill (Reddit/ProductHunt hybrid) */}
      <div className="flex flex-col items-center shrink-0">
        <button
          onClick={handleVote}
          disabled={isVoting}
          className={`flex flex-col items-center justify-center w-10 sm:w-11 py-1.5 sm:py-2 rounded-xl border transition-all cursor-pointer select-none ${
            hasUpvoted
              ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-950/60 dark:border-blue-600 dark:text-blue-400'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="Upvote post"
        >
          <ChevronUp
            className={`w-4 h-4 transition-transform ${
              hasUpvoted ? 'translate-y-[-1px] stroke-[2.5]' : ''
            }`}
          />
          <span className="text-xs font-bold leading-none mt-0.5">{upvotes}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Post Metadata Header */}
        <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
          <Badge variant="outline" size="sm">
            {post.category}
          </Badge>

          {post.isAnonymous ? (
            <Badge variant="anonymous" size="sm" icon>
              Anonymous Contributor
            </Badge>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.displayName}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700" />
              )}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {post.author.displayName}
              </span>
            </div>
          )}

          <span className="text-slate-400 dark:text-slate-600">·</span>
          <span className="text-slate-500 dark:text-slate-400">
            {formatTimeAgo(post.createdAt)}
          </span>

          {post.productUrl && (
            <>
              <span className="text-slate-400 dark:text-slate-600">·</span>
              <a
                href={post.productUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[140px]"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{post.productUrl.replace(/^https?:\/\//, '')}</span>
              </a>
            </>
          )}
        </div>

        {/* Title */}
        <Link to={`/posts/${post.id}`} className="group block">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug mb-1.5">
            {post.title}
          </h2>
        </Link>

        {/* Description snippet */}
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {post.description}
        </p>

        {/* Footer actions & tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex items-center gap-3">
            {/* Comments trigger */}
            <Link
              to={`/posts/${post.id}`}
              className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{post.commentsCount} comments</span>
            </Link>

            {/* AI Insights Badge / Button */}
            {post.hasAiAnalysis ? (
              <Link
                to={`/posts/${post.id}?tab=insights`}
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-2 py-0.5 rounded-md font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Insights</span>
              </Link>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                Awaiting insights
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleBookmark}
              className={`p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                hasBookmarked ? 'text-amber-500 dark:text-amber-400 fill-current' : ''
              }`}
              title={hasBookmarked ? 'Saved to bookmarks' : 'Save discussion'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${hasBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};
