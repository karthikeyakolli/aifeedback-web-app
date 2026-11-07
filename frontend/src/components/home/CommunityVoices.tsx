import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp, ArrowRight } from 'lucide-react';
import type { PublicCommentRecent } from '../../types';
import { api } from '../../services/api';
import { formatTimeAgo } from '../../lib/utils';

export const CommunityVoices: React.FC = () => {
  const [comments, setComments] = useState<PublicCommentRecent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getRecentComments(15)
      .then((data) => {
        if (isMounted) {
          setComments(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load recent comments:', err);
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isLoading && comments.length === 0) {
    return null;
  }

  // Double the list for seamless CSS infinite marquee
  const marqueeItems = [...comments, ...comments];

  return (
    <section className="w-full py-12 border-b border-[var(--border-default)] bg-[var(--surface-raised)]/20 overflow-hidden" aria-label="Community Voices">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community Voices</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Live feedback from builders and community members
          </h2>
        </div>
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline shrink-0"
        >
          <span>Explore all discussions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Marquee Track Container */}
      <div className="relative w-full overflow-hidden group">
        {/* Subtle Edge Fade Gradients */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 z-10 bg-gradient-to-r from-[var(--surface)] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 z-10 bg-gradient-to-l from-[var(--surface)] to-transparent" />

        <div className="flex gap-4 w-max animate-marquee group-hover:[animation-play-state:paused] px-4">
          {marqueeItems.map((comment, index) => (
            <Link
              key={`${comment.id}-${index}`}
              to={`/projects/${comment.projectId}`}
              className="w-80 sm:w-96 p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:shadow-md transition-all shrink-0 flex flex-col justify-between group/card text-left"
            >
              <div>
                {/* Header: Project Badge & Timestamp */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border-default)] truncate max-w-[200px]">
                    {comment.projectTitle}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] shrink-0">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>

                {/* Comment Text Snippet */}
                <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed mb-4 group-hover/card:text-[var(--text-primary)] transition-colors">
                  "{comment.content}"
                </p>
              </div>

              {/* Author & Helpful Upvote Counter */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]/60 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {comment.avatarUrl ? (
                    <img
                      src={comment.avatarUrl}
                      alt={comment.displayName}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center font-bold text-[10px] shrink-0">
                      {comment.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="truncate">
                    <span className="font-semibold text-[var(--text-primary)] mr-1 truncate">
                      {comment.displayName}
                    </span>
                    <span className="text-[var(--text-muted)] text-[10px] truncate">
                      @{comment.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[var(--text-muted)] shrink-0 font-medium text-[11px]">
                  <ThumbsUp className="w-3 h-3 text-[var(--accent)]" />
                  <span>{comment.upvotesCount}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
