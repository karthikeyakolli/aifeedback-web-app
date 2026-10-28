import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ChevronUp,
  MessageSquare,
  Sparkles,
  Bookmark,
  ExternalLink,
  ArrowLeft,
  Share2,
  Check,
  AlertCircle,
  Flag,
} from 'lucide-react';
import type { Post, Comment, AIAnalysis } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
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
  const { isAuthenticated, openAuthModal } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate, misleading, or spam content');
  const [reportSubmitted, setReportSubmitted] = useState(false);

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
        el.classList.add('bg-blue-50/70', 'dark:bg-blue-950/40', 'rounded-lg');
        setTimeout(() => {
          el.classList.remove('bg-blue-50/70', 'dark:bg-blue-950/40');
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
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24 mb-4" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Discussion Not Found
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The requested product review post does not exist or has been removed.
        </p>
        <Link to="/">
          <Button variant="secondary" size="sm">
            Return to Feed
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Discussions
      </Link>

      {/* Main Post Card */}
      <Card className="p-5 sm:p-7">
        {/* Header Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" size="sm">
              {post.category}
            </Badge>

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
                  <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                )}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {post.author.displayName}
                </span>
              </div>
            )}

            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              Published {formatTimeAgo(post.createdAt)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Share discussion"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                post.userHasBookmarked ? 'text-amber-500 dark:text-amber-400 fill-current' : ''
              }`}
              title="Save discussion"
            >
              <Bookmark className={`w-3.5 h-3.5 ${post.userHasBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => setIsReporting(!isReporting)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Report content"
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report</span>
            </button>
          </div>
        </div>

        {/* Report Moderation Box */}
        {isReporting && (
          <div className="mb-4 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-xs space-y-3">
            {reportSubmitted ? (
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Thank you. Report received and queued for moderation review.</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-rose-500" />
                    Report Discussion to Moderators
                  </span>
                  <button
                    onClick={() => setIsReporting(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400">Select reason:</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
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

        {/* Post Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug mb-3">
          {post.title}
        </h1>

        {/* Product URL pill */}
        {post.productUrl && (
          <div className="mb-4">
            <a
              href={post.productUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-200/60 dark:border-blue-900/40"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Visit Product: {post.productUrl}</span>
            </a>
          </div>
        )}

        {/* Post Body */}
        <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-6 font-normal">
          {post.description}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Upvote & engagement bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleVote}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              post.userHasUpvoted
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <ChevronUp className="w-4 h-4" />
            <span>Upvote {post.upvotesCount}</span>
          </button>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            {comments.length} community {comments.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </Card>

      {/* Tabs navigation: Discussion vs AI Research Insights */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSearchParams({ tab: 'discussion' })}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'discussion'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Community Discussion ({comments.length})</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'insights' })}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'insights'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>AI Research Insights</span>
          {aiAnalysis && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Verified
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'discussion' ? (
        <div className="space-y-6">
          {/* Main Comment Composer */}
          <CommentComposer postId={post.id} onSubmit={handleAddComment} />

          {/* Comments List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Reviews & Perspectives ({comments.length})
            </h3>

            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <Card key={comment.id} className="p-4 sm:p-5">
                    <CommentThread
                      comment={comment}
                      postId={post.id}
                      onAddReply={handleAddComment}
                    />
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                No reviews yet. Be the first to share your constructive perspective!
              </Card>
            )}
          </div>
        </div>
      ) : (
        <AIInsightsView
          postId={post.id}
          initialAnalysis={aiAnalysis}
          onJumpToComment={handleJumpToComment}
        />
      )}
    </div>
  );
};
