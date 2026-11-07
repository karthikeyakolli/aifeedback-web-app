import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  ChevronUp,
  Sparkles,
  Hash,
  Send,
  User,
  ShieldAlert,
  Flame,
  Clock,
  Search,
  ExternalLink,
  Tag,
  CornerDownRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { PublicCommentRecent, PublicProject } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatTimeAgo } from '../lib/utils';
import { EmptyState } from '../components/common/EmptyState';

export const DiscussionsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [comments, setComments] = useState<PublicCommentRecent[]>([]);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'popular' | 'recent'>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProjectFilter, setActiveProjectFilter] = useState<string>(
    searchParams.get('project') || ''
  );

  // Composer State
  const [composerProjectId, setComposerProjectId] = useState<string>('');
  const [composerContent, setComposerContent] = useState('');
  const [composerIsAnonymous, setComposerIsAnonymous] = useState(false);
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [composerSuccess, setComposerSuccess] = useState(false);

  // Quick reply state for active accordion
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Load projects & comments
  const loadData = async () => {
    setLoading(true);
    try {
      const [projList, recentComments] = await Promise.all([
        api.getPublicProjects().catch(() => []),
        api.getRecentComments({
          projectId: activeProjectFilter || undefined,
          sort,
          limit: 50,
        }).catch(() => []),
      ]);
      setProjects(projList);
      setComments(recentComments);

      // Default composer project if available
      if (!composerProjectId && projList.length > 0) {
        setComposerProjectId(activeProjectFilter || projList[0].id);
      }
    } catch (err) {
      console.error('Failed to load discussions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProjectFilter, sort]);

  // Sync project filter query param
  const handleSelectProjectFilter = (projId: string) => {
    setActiveProjectFilter(projId);
    if (projId) {
      setSearchParams({ project: projId });
    } else {
      setSearchParams({});
    }
  };

  // Upvote toggle
  const handleToggleVote = async (commentId: string, currentUpvoted?: boolean) => {
    if (!user) {
      alert('Please log in or create an account to upvote discussions.');
      return;
    }

    // Optimistic update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const nextUpvoted = !currentUpvoted;
          return {
            ...c,
            userHasUpvoted: nextUpvoted,
            upvotesCount: nextUpvoted ? c.upvotesCount + 1 : Math.max(0, c.upvotesCount - 1),
          };
        }
        return c;
      })
    );

    try {
      await api.toggleUpvoteComment(commentId);
    } catch (err) {
      console.error('Vote failed:', err);
      // Revert on error
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              userHasUpvoted: currentUpvoted,
              upvotesCount: currentUpvoted ? c.upvotesCount + 1 : Math.max(0, c.upvotesCount - 1),
            };
          }
          return c;
        })
      );
    }
  };

  // Submit new review to lounge & project
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setComposerError('Please sign in or create an account to share reviews.');
      return;
    }
    if (!composerProjectId) {
      setComposerError('Please select a #ProjectTag to associate your review.');
      return;
    }
    if (composerContent.trim().length < 5) {
      setComposerError('Review content must be at least 5 characters.');
      return;
    }

    setComposerSubmitting(true);
    setComposerError(null);

    try {
      const created = await api.addComment({
        postId: composerProjectId,
        content: composerContent.trim(),
        isAnonymous: composerIsAnonymous,
      });

      const selectedProj = projects.find((p) => p.id === composerProjectId);

      // Prepend to current feed
      const newCommentItem: PublicCommentRecent = {
        id: created.id,
        postId: created.postId,
        content: created.content,
        upvotesCount: 0,
        createdAt: created.createdAt || new Date().toISOString(),
        projectTitle: selectedProj?.name || 'Project Community',
        projectId: composerProjectId,
        category: selectedProj?.category || 'General',
        username: composerIsAnonymous ? 'anonymous' : (user.username || user.displayName),
        displayName: composerIsAnonymous ? 'Anonymous Reviewer' : user.displayName,
        avatarUrl: composerIsAnonymous ? null : user.avatarUrl,
        isAnonymous: composerIsAnonymous,
        userHasUpvoted: false,
      };

      setComments((prev) => [newCommentItem, ...prev]);
      setComposerContent('');
      setComposerSuccess(true);
      setTimeout(() => setComposerSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to post review:', err);
      setComposerError(err?.message || 'Failed to publish review. Please try again.');
    } finally {
      setComposerSubmitting(false);
    }
  };

  // Submit quick reply
  const handleSubmitReply = async (parentComment: PublicCommentRecent) => {
    if (!user) {
      alert('Please log in to reply.');
      return;
    }
    if (replyContent.trim().length < 2) return;

    setReplySubmitting(true);
    try {
      await api.addComment({
        postId: parentComment.projectId || parentComment.postId,
        content: replyContent.trim(),
        isAnonymous: false,
        parentCommentId: parentComment.id,
      });

      setReplyContent('');
      setActiveReplyId(null);
      // Reload discussions to reflect replies
      loadData();
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setReplySubmitting(false);
    }
  };

  // Filtered comments
  const filteredComments = useMemo(() => {
    let list = comments;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.content.toLowerCase().includes(q) ||
          c.projectTitle.toLowerCase().includes(q) ||
          c.displayName.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [comments, searchQuery]);

  return (
    <div className="min-h-screen pb-20 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Header & Hero Lounge */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface)]/70 backdrop-blur-xl p-8 sm:p-10 shadow-sm">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-secondary)] shadow-sm">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
            <span>Live Public Discussion Lounge</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Community Discussions & Reviews
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
            Real architectural feedback, bug discoveries, and user critiques tagged across projects.
            Join the conversation or post a review linked to any project.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{comments.length} Community Reviews</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-indigo-500" />
              <span>{projects.length} Active Projects</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>AI Grounded Citations</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Public Review Composer with #ProjectTag */}
      <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface)]/70 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] text-cyan-500">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Share Feedback with #ProjectTag
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Your review appears here in the global lounge and directly on the project's page.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
          {composerError && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-600 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{composerError}</span>
            </div>
          )}

          {composerSuccess && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-600 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Check className="w-4 h-4 shrink-0" />
              <span>Your review was published to the global lounge and synchronized with the project!</span>
            </div>
          )}

          {/* Project Tag Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>Select Project to Tag</span>
            </label>
            <select
              value={composerProjectId}
              onChange={(e) => setComposerProjectId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all cursor-pointer"
            >
              {projects.length === 0 ? (
                <option value="">No projects published yet</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.name} ({p.category})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Review Content */}
          <div className="space-y-1.5">
            <textarea
              rows={3}
              value={composerContent}
              onChange={(e) => setComposerContent(e.target.value)}
              placeholder="What are your thoughts on this architecture? Share bug observations, UX friction, or feature critiques..."
              className="w-full px-4 py-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all resize-none"
            />
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={composerIsAnonymous}
                onChange={(e) => setComposerIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-default)] text-cyan-600 focus:ring-cyan-500/30"
              />
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                Post as Anonymous Reviewer
              </span>
            </label>

            <button
              type="submit"
              disabled={composerSubmitting || !composerContent.trim() || projects.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{composerSubmitting ? 'Publishing...' : 'Publish to Lounge'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Filter & Sort Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions, tags, or authors..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setSort('popular')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              sort === 'popular'
                ? 'bg-[var(--surface-raised)] border-cyan-500/50 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Popular</span>
          </button>
          <button
            onClick={() => setSort('recent')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              sort === 'recent'
                ? 'bg-[var(--surface-raised)] border-cyan-500/50 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Newest</span>
          </button>
        </div>
      </div>

      {/* 4. Horizontal #ProjectTag Filter Bar */}
      {projects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => handleSelectProjectFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
              !activeProjectFilter
                ? 'bg-[var(--surface-raised)] border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]'
            }`}
          >
            #All Projects ({comments.length})
          </button>
          {projects.map((proj) => {
            const isSelected = activeProjectFilter === proj.id;
            return (
              <button
                key={proj.id}
                onClick={() => handleSelectProjectFilter(isSelected ? '' : proj.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[var(--surface-raised)] border-cyan-500/50 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]'
                }`}
              >
                #{proj.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 5. Reddit-Style Discussion Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)]/50 animate-pulse"
              />
            ))}
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface)]/70 backdrop-blur-md p-10">
            <EmptyState
              icon={<MessageSquare className="w-10 h-10 text-[var(--text-muted)]" />}
              title="No Discussions Found"
              description={
                activeProjectFilter
                  ? 'No discussions or reviews found for this project tag yet. Be the first to share one above!'
                  : 'No community reviews have been posted yet. Publish your feedback with a #ProjectTag to start the conversation!'
              }
            />
          </div>
        ) : (
          filteredComments.map((comment) => {
            const isAccordionOpen = activeReplyId === comment.id;

            return (
              <article
                key={comment.id}
                className="group relative rounded-2xl border border-[var(--border-default)] bg-[var(--surface)]/70 backdrop-blur-md hover:bg-[var(--surface)]/90 hover:border-[var(--border-focus)] transition-all duration-300 p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  {/* Left Upvote Column */}
                  <div className="flex flex-col items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleVote(comment.id, comment.userHasUpvoted)}
                      className={`flex flex-col items-center justify-center w-10 py-2 rounded-xl border transition-all duration-200 active:scale-95 ${
                        comment.userHasUpvoted
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-600 dark:text-cyan-400 font-semibold'
                          : 'bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-focus)]'
                      }`}
                    >
                      <ChevronUp
                        className={`w-4 h-4 transition-transform duration-200 ${
                          comment.userHasUpvoted ? 'stroke-[2.5] -translate-y-0.5' : ''
                        }`}
                      />
                      <span className="text-xs font-semibold mt-0.5">{comment.upvotesCount}</span>
                    </button>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* #ProjectTag Badge */}
                        <button
                          onClick={() => handleSelectProjectFilter(comment.projectId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--surface-raised)] border border-[var(--border-default)] text-cyan-600 dark:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                        >
                          <Hash className="w-3 h-3" />
                          <span>{comment.projectTitle}</span>
                        </button>

                        <span className="text-[var(--text-muted)]">•</span>

                        {/* Author */}
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          {comment.isAnonymous ? (
                            <span className="inline-flex items-center gap-1 text-[var(--text-muted)] font-medium">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Anonymous Reviewer
                            </span>
                          ) : (
                            <Link
                              to={`/creator/${comment.username}`}
                              className="font-medium hover:text-cyan-500 transition-colors flex items-center gap-1"
                            >
                              <User className="w-3 h-3 text-[var(--text-muted)]" />
                              <span>{comment.displayName}</span>
                            </Link>
                          )}
                        </div>

                        <span className="text-[var(--text-muted)]">•</span>

                        {/* Timestamp */}
                        <span className="text-[var(--text-muted)]">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>

                      {/* View Project Link */}
                      <Link
                        to={`/project/${comment.projectId}`}
                        className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-cyan-500 transition-colors"
                      >
                        <span>Project</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Comment Body */}
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
                      {comment.content}
                    </p>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center gap-4 pt-1 text-xs text-[var(--text-muted)]">
                      <button
                        onClick={() =>
                          setActiveReplyId(isAccordionOpen ? null : comment.id)
                        }
                        className="inline-flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </div>

                    {/* Reply Accordion Box */}
                    {isAccordionOpen && (
                      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2 animate-fade-in">
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                          <CornerDownRight className="w-3.5 h-3.5 text-cyan-500" />
                          <span>Replying to {comment.displayName}</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write your reply..."
                            className="flex-1 px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                          <button
                            onClick={() => handleSubmitReply(comment)}
                            disabled={replySubmitting || !replyContent.trim()}
                            className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                          >
                            {replySubmitting ? '...' : 'Send'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
