import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ChevronUp,
  MessageSquare,
  Sparkles,
  Bookmark,
  ExternalLink,
  Share2,
  Check,
  AlertCircle,
  Flag,
  Lock,
  Package,
  Layers,
  ChevronRight,
} from 'lucide-react';
import type { Post, Comment, AIAnalysis } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { CommentComposer } from '../components/discussion/CommentComposer';
import { CommentThread } from '../components/discussion/CommentThread';
import { AIInsightsView } from '../components/insights/AIInsightsView';
import { formatTimeAgo } from '../lib/utils';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'discussion';
  const { user, isAuthenticated, openAuthModal, isLoading: isAuthLoading } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate, misleading, or spam content');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const isOwner = Boolean(user && post?.author?.id && user.id === post.author.id);

  // Protect creator research studio from unauthorized direct query params
  // Per Phase 3: Creator Research Studio is strictly private to the verified project owner
  useEffect(() => {
    if (activeTab === 'insights' && !isLoading && !isAuthLoading && post && !isOwner) {
      setSearchParams({ tab: 'discussion' });
    }
  }, [activeTab, isLoading, isAuthLoading, post, isOwner, setSearchParams]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    Promise.all([
      api.getPostById(id),
      api.getComments(id),
      api.getAiAnalysis(id),
    ])
      .then(([p, c, a]) => {
        setPost(p);
        setComments(c);
        setAiAnalysis(a);

        // Fetch related discussions in the same category
        if (p?.category) {
          api.getPosts({ category: p.category, limit: 4 })
            .then((list) => {
              setRelatedPosts(list.filter((item) => item.id !== id).slice(0, 3));
            })
            .catch(() => {});
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleVote = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!post) return;
    const prev = post.upvotesCount;
    const prevStatus = post.userHasUpvoted;

    setPost({
      ...post,
      upvotesCount: prevStatus ? prev - 1 : prev + 1,
      userHasUpvoted: !prevStatus,
    });

    try {
      const res = await api.toggleUpvotePost(post.id);
      setPost((curr) =>
        curr
          ? { ...curr, upvotesCount: res.upvotesCount, userHasUpvoted: res.userHasUpvoted }
          : null
      );
    } catch {
      setPost((curr) =>
        curr ? { ...curr, upvotesCount: prev, userHasUpvoted: prevStatus } : null
      );
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!post) return;
    const prev = post.userHasBookmarked;
    setPost({ ...post, userHasBookmarked: !prev });
    try {
      const res = await api.toggleBookmarkPost(post.id);
      setPost((curr) => (curr ? { ...curr, userHasBookmarked: res.userHasBookmarked } : null));
    } catch {
      setPost((curr) => (curr ? { ...curr, userHasBookmarked: prev } : null));
    }
  };

  const handleReportPost = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!post) return;
    try {
      await api.submitReport({
        targetType: 'post',
        targetId: post.id,
        reason: reportReason,
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setIsReporting(false);
        setReportSubmitted(false);
      }, 2500);
    } catch (e: any) {
      alert(e.message || 'Failed to submit report');
    }
  };

  const handleAddComment = async (
    content: string,
    isAnonymous: boolean,
    parentCommentId?: string
  ) => {
    if (!post) return;
    await api.addComment({
      postId: post.id,
      content,
      isAnonymous,
      parentCommentId,
    });

    // Refresh comments list
    const updated = await api.getComments(post.id);
    setComments(updated);
    setPost((curr) => (curr ? { ...curr, commentsCount: curr.commentsCount + 1 } : null));
  };

  const handleJumpToComment = (commentId: string) => {
    setSearchParams({ tab: 'discussion' });
    setTimeout(() => {
      const el = document.getElementById(`comment-${commentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-indigo-50/70', 'dark:bg-indigo-950/40', 'rounded-xl');
        setTimeout(() => {
          el.classList.remove('bg-indigo-50/70', 'dark:bg-indigo-950/40');
        }, 2500);
      }
    }, 150);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-8 animate-pulse">
        <div className="h-4 bg-[var(--border-subtle)] rounded w-24 mb-4" />
        <div className="h-8 bg-[var(--border-subtle)] rounded w-3/4" />
        <div className="h-36 bg-[var(--border-subtle)] rounded-2xl w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Discussion Not Found
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          The requested product review post does not exist or has been removed.
        </p>
        <Link to="/">
          <Button variant="secondary" size="sm">
            Return to Community Feed
          </Button>
        </Link>
      </div>
    );
  }

  // Extract clean product name if available
  const productName = post.title.includes(':')
    ? post.title.split(':')[0].trim()
    : post.title.includes(' - ')
    ? post.title.split(' - ')[0].trim()
    : null;

  const domain = post.productUrl
    ? post.productUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : null;

  return (
    <div className={`${activeTab === 'insights' ? 'max-w-[1600px] w-full' : 'max-w-4xl'} mx-auto space-y-6 pb-12 transition-all`}>
      {/* Product & Community Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">
          Community
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/explore?category=${encodeURIComponent(post.category)}`} className="hover:text-[var(--text-primary)] transition-colors">
          {post.category}
        </Link>
        {productName && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/products/${post.id}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              {productName}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-[var(--text-primary)] font-medium truncate max-w-[200px]">
          Discussion #{post.id.slice(0, 8)}
        </span>
      </nav>

      {/* Main Discussion Post Card (Tactile Neomorphic) */}
      <article className="neomorph-card p-6 sm:p-8 space-y-5">
        {/* Header Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" size="sm">
              {post.category}
            </Badge>

            {productName && (
              <Link
                to={`/products/${post.id}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900/60 hover:bg-indigo-100 transition-colors"
              >
                <Package className="w-3 h-3" />
                <span>{productName} Profile</span>
              </Link>
            )}

            {post.isAnonymous ? (
              <Badge variant="anonymous" size="sm" icon>
                Anonymous Creator
              </Badge>
            ) : (
              <div className="flex items-center gap-1.5">
                {post.author.avatarUrl ? (
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.displayName}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[9px] flex items-center justify-center font-bold">
                    {post.author.displayName.charAt(0)}
                  </div>
                )}
                <span className="font-bold text-[var(--text-primary)]">
                  {post.author.displayName}
                </span>
                {typeof post.author.reputationScore === 'number' && (
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    ★ {post.author.reputationScore}
                  </span>
                )}
              </div>
            )}

            <span className="text-[var(--text-muted)]">·</span>
            <span className="text-[var(--text-muted)]">
              Published {formatTimeAgo(post.createdAt)}
            </span>
          </div>

          {/* Social Actions (Share, Bookmark, Report) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Share discussion"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-semibold">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer ${
                post.userHasBookmarked ? 'text-amber-500 dark:text-amber-400' : ''
              }`}
              title="Save discussion"
            >
              <Bookmark className={`w-3.5 h-3.5 ${post.userHasBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => setIsReporting(!isReporting)}
              className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-rose-600 transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Report content"
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold">Report</span>
            </button>
          </div>
        </div>

        {/* Report Moderation Form */}
        {isReporting && (
          <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-xs space-y-3">
            {reportSubmitted ? (
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Thank you. Report received and queued for moderation review.</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-rose-500" />
                    Report Discussion to Moderators
                  </span>
                  <button
                    onClick={() => setIsReporting(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[var(--text-muted)]">Select reason:</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs"
                  >
                    <option value="Inappropriate, misleading, or spam content">Inappropriate, misleading, or spam content</option>
                    <option value="Harassment or policy violation">Harassment or policy violation</option>
                    <option value="Commercial solicitation without disclosure">Commercial solicitation without disclosure</option>
                    <option value="Duplicate or irrelevant review request">Duplicate or irrelevant review request</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="danger" onClick={handleReportPost}>
                    Submit Report
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Discussion Heading */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] leading-snug">
          {post.title}
        </h1>

        {/* Product URL Pill */}
        {post.productUrl && domain && (
          <div>
            <a
              href={post.productUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors border border-indigo-200/80 dark:border-indigo-900/60"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Visit Product: {domain}</span>
            </a>
          </div>
        )}

        {/* Post Description Body (Readable Line Lengths) */}
        <div className="text-sm sm:text-base text-[var(--text-primary)]/90 leading-relaxed whitespace-pre-line font-normal max-w-prose">
          {post.description}
        </div>

        {/* Topic Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Upvote & Engagement Bar (Tactile Neomorphic) */}
        <div className="flex items-center justify-between pt-5 border-t border-[var(--border-subtle)]">
          <button
            onClick={handleVote}
            role="button"
            aria-pressed={post.userHasUpvoted}
            aria-label={
              post.userHasUpvoted
                ? `Remove upvote from "${post.title}"`
                : `Upvote "${post.title}" (${post.upvotesCount} votes)`
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
              post.userHasUpvoted
                ? 'bg-indigo-600 text-white shadow-xs neomorph-inset'
                : 'border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-slate-300 dark:hover:border-slate-700 neomorph-pill'
            }`}
          >
            <ChevronUp className="w-4 h-4" />
            <span>Upvote {post.upvotesCount}</span>
          </button>

          <span className="text-xs text-[var(--text-muted)] font-medium">
            {comments.length} community {comments.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </article>

      {/* Locked Discussion Banner (Moderation) */}
      {post.status === 'locked' && (
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>This discussion has been locked by a community moderator. New replies are paused.</span>
        </div>
      )}

      {/* Creator Personal Workspace Dock (Verified Owner Exclusive) */}
      {isOwner && (
        <div className="p-5 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-raised)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white shadow-xs">
                <Lock className="w-3 h-3" /> Creator Research Studio
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                Owner Workspace
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Synthesize community reviews, attach project documentation (PDF, Markdown), and query the AI research assistant.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={activeTab === 'insights' ? 'primary' : 'outline'}
              onClick={() => setSearchParams({ tab: activeTab === 'insights' ? 'discussion' : 'insights' })}
              className="cursor-pointer font-bold shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              {activeTab === 'insights' ? 'Back to Discussion' : 'Open Research Studio'}
            </Button>
          </div>
        </div>
      )}

      {/* Tabs navigation: Community sees only Discussion; Verified Owner sees both */}
      {isOwner && (
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)]">
          <button
            onClick={() => setSearchParams({ tab: 'discussion' })}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'discussion'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Community Discussion ({comments.length})</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'insights' })}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Creator Research Studio</span>
            {aiAnalysis && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Verified
              </span>
            )}
          </button>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'insights' && isOwner ? (
        <AIInsightsView
          postId={post.id}
          postAuthorId={post.author.id}
          initialAnalysis={aiAnalysis}
          onJumpToComment={handleJumpToComment}
        />
      ) : (
        <section aria-label="Discussion Thread" className="space-y-6">
          {/* Main Comment Composer (hidden if locked) */}
          {post.status !== 'locked' ? (
            <CommentComposer postId={post.id} onSubmit={handleAddComment} />
          ) : (
            <div className="neomorph-card p-4 text-center text-xs text-[var(--text-muted)]">
              Comments are currently closed for this discussion.
            </div>
          )}

          {/* Comments List & Bounded Hierarchy */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Community Reviews & Perspectives ({comments.length})
              </h2>
            </div>

            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="neomorph-card p-4 sm:p-5">
                    <CommentThread
                      comment={comment}
                      postId={post.id}
                      postAuthorId={post.author.id}
                      onAddReply={handleAddComment}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="neomorph-card p-8 text-center text-[var(--text-muted)] text-xs space-y-2">
                <p>No community reviews yet.</p>
                <p className="text-[11px]">Be the first to share your constructive perspective on this product!</p>
              </div>
            )}
          </div>

          {/* Related Discussions Section */}
          {relatedPosts.length > 0 && (
            <aside aria-label="Related Discussions" className="pt-6 border-t border-[var(--border-subtle)] space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" /> Related in {post.category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.id}
                    to={`/posts/${rel.id}`}
                    className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-indigo-400/50 transition-colors group"
                  >
                    <h3 className="font-bold text-xs text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 mb-1">
                      {rel.title}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {rel.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-muted)]">
                      <span>{rel.upvotesCount} votes</span>
                      <span>·</span>
                      <span>{rel.commentsCount} reviews</span>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          )}
        </section>
      )}
    </div>
  );
};
