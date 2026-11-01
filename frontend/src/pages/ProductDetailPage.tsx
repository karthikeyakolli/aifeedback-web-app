import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ExternalLink,
  ChevronLeft,
  ChevronUp,
  MessageSquare,
  MessageSquareCheck,
  Sparkles,
  Layers,
  ShieldCheck,
  Plus,
  Share2,
  Check,
} from 'lucide-react';
import type { Post, Comment, Product } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { extractProductFromPost } from '../lib/products';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PostCard } from '../components/feed/PostCard';
import { formatTimeAgo } from '../lib/utils';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    Promise.all([api.getPostById(id), api.getComments(id)])
      .then(([p, c]) => {
        if (p) {
          setPost(p);
          setProduct(extractProductFromPost(p));
        }
        setComments(c);
      })
      .catch((err) => console.error('Failed to load product details:', err))
      .finally(() => setIsLoading(false));
  }, [id]);

  const isOwner = Boolean(user && post?.author?.id && user.id === post.author.id);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4">
        <div className="h-6 w-32 bg-[var(--border-subtle)] rounded-md animate-pulse" />
        <div className="h-40 bg-[var(--border-subtle)] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-[var(--border-subtle)] rounded-xl animate-pulse" />
          <div className="h-24 bg-[var(--border-subtle)] rounded-xl animate-pulse" />
          <div className="h-24 bg-[var(--border-subtle)] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!post || !product) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Product Not Found</h2>
        <p className="text-xs text-[var(--text-muted)]">
          The requested product profile does not exist or has been removed.
        </p>
        <Link to="/explore">
          <Button variant="primary">Browse All Products</Button>
        </Link>
      </div>
    );
  }

  const domain = product.productUrl
    ? product.productUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Products
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-medium">{product.name}</span>
      </div>

      {/* Product Hero Header */}
      <div className="neomorph-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl shadow-sm shrink-0">
              {product.name.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  {product.name}
                </h1>
                <Badge variant="outline" size="sm" className="font-medium">
                  {product.category}
                </Badge>
              </div>

              <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                {product.tagline}
              </p>

              {/* Creator & Link Affordances */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <span>Created by</span>
                  <strong className="text-[var(--text-primary)]">
                    {post.isAnonymous ? 'Anonymous Creator' : post.author.displayName}
                  </strong>
                  {!post.isAnonymous && post.author.reputationScore !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
                      ★ {post.author.reputationScore}
                    </span>
                  )}
                </span>
                <span>·</span>
                <span>Published {formatTimeAgo(product.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0">
            {product.productUrl && (
              <a
                href={product.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <span>Visit {domain || 'Website'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Creator-Only AI Research Studio Banner (Social Translucence & Private Boundary) */}
        {isOwner && (
          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-transparent dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-transparent border border-indigo-200/80 dark:border-indigo-900/60">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                    Creator Personal Workspace
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 font-semibold uppercase tracking-wider">
                    Owner Only
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Synthesize review comments, attach PDF specifications, and extract grounded product PRDs. Public visitors cannot see your research workspace.
                </p>
              </div>
            </div>

            <Link to={`/posts/${post.id}?tab=insights`} className="shrink-0">
              <Button size="sm" variant="primary" leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}>
                Open Research Studio
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Community Activity & Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="neomorph-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
            <ChevronUp className="w-4 h-4 text-indigo-500" />
            <span>Community Votes</span>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {product.upvotesCount}
          </div>
        </div>

        <div className="neomorph-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
            <MessageSquareCheck className="w-4 h-4 text-emerald-500" />
            <span>Total Reviews</span>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {product.totalReviews}
          </div>
        </div>

        <div className="neomorph-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span>Discussions</span>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {product.discussionCount}
          </div>
        </div>

        <div className="neomorph-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Review Status</span>
          </div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            Active Review
          </div>
        </div>
      </div>

      {/* Product Overview & Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description & Features */}
        <div className="lg:col-span-2 space-y-6">
          <div className="neomorph-card p-6 space-y-4">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              About {product.name}
            </h2>
            <div className="text-xs sm:text-sm text-[var(--text-primary)]/90 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>

            {/* Feature List */}
            {product.features && product.features.length > 0 && (
              <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" /> Key Features & Capabilities
                </h3>
                <ul className="grid grid-cols-1 gap-2">
                  {product.features.map((feat: string, idx: number) => (
                    <li
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Discussions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Community Discussions ({product.discussionCount})
              </h2>

              <Link to={`/create?productUrl=${encodeURIComponent(product.productUrl || '')}`}>
                <Button size="sm" variant="secondary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  New Discussion
                </Button>
              </Link>
            </div>

            {/* Primary Review Discussion Card */}
            <PostCard post={post} />
          </div>
        </div>

        {/* Right Col: Recent Community Feedback Highlights */}
        <div className="space-y-6">
          <div className="neomorph-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <MessageSquareCheck className="w-4 h-4 text-emerald-500" /> Recent Feedback
              </h2>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {comments.length} total
              </span>
            </div>

            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.slice(0, 4).map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {comment.isAnonymous ? 'Anonymous Reviewer' : comment.author.displayName}
                      </span>
                      <span>{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-[var(--text-primary)]/90 leading-relaxed line-clamp-3">
                      "{comment.content}"
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>{comment.upvotesCount} upvotes</span>
                    </div>
                  </div>
                ))}

                <Link
                  to={`/posts/${post.id}`}
                  className="block text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                >
                  View full conversation thread →
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[var(--text-muted)] space-y-3">
                <p>No community feedback posted yet.</p>
                <Link to={`/posts/${post.id}`}>
                  <Button size="sm" variant="outline">
                    Be the first to review
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Privacy & Moderation Notice */}
          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] space-y-1.5">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-500" /> Candid Community Feedback
            </div>
            <p className="leading-relaxed">
              Reviews on ResearchIntel are governed by community guidelines. Constructive critique is welcomed; spam and abusive conduct are moderated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
