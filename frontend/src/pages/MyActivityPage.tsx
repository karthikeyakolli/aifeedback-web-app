import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  Lock,
  Sparkles,
  ArrowRight,
  Package,
  Bookmark,
  ChevronUp,
} from 'lucide-react';
import type { Post } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/feed/PostCard';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/LoadingSkeletons';

type ActivityTab = 'discussions' | 'saved' | 'upvoted';

export const MyActivityPage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<ActivityTab>('discussions');
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [upvotedPosts, setUpvotedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    Promise.all([
      api.getPosts(),
      api.getSavedPosts().catch(() => []),
    ])
      .then(([allPosts, saved]) => {
        // Filter authored posts
        const authored = allPosts.filter(
          (p) => p.author?.id === user.id || p.author?.username === user.username
        );
        // Filter upvoted posts
        const upvoted = allPosts.filter((p) => p.userHasUpvoted);

        setMyPosts(authored);
        setSavedPosts(saved);
        setUpvotedPosts(upvoted);
      })
      .catch((err) => console.error('Failed to load user activity:', err))
      .finally(() => setIsLoading(false));
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4 max-w-lg mx-auto my-12 neomorph-card">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Sign In to Access Your Activity
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Sign in to access your authored products, review discussions, private research workspace, and reputation statistics.
        </p>
        <Button variant="primary" onClick={() => openAuthModal('login')}>
          Sign In to Account
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Profile Summary (Tactile Neomorphic Card) */}
      <div className="neomorph-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[var(--accent)] border border-blue-200/70 flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
              {user.displayName?.charAt(0) || 'U'}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                {user.displayName}
              </h1>
              <span className="text-xs text-[var(--text-muted)] font-mono">@{user.username}</span>
            </div>
            {user.bio && (
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{user.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)] pt-1">
              <span>
                Reputation Score:{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                  ★ {user.reputationScore}
                </strong>
              </span>
              <span>·</span>
              <span>
                Authored Products:{' '}
                <strong className="text-[var(--text-primary)]">{myPosts.length}</strong>
              </span>
              <span>·</span>
              <span>
                Saved Discussions:{' '}
                <strong className="text-[var(--text-primary)]">{savedPosts.length}</strong>
              </span>
            </div>
          </div>
        </div>

        <Link to="/create" className="shrink-0">
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            New Discussion
          </Button>
        </Link>
      </div>

      {/* Privacy & Social Translucence Safeguard Banner */}
      <div className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block mb-0.5">Privacy & Anonymity Enforcement</strong>
          <p className="leading-relaxed text-emerald-700 dark:text-emerald-400/90 text-[11px]">
            Contributions you marked as "Anonymous" remain fully concealed on public profile listings. You retain owner permissions to manage them and open your AI Research Studio from this private dashboard.
          </p>
        </div>
      </div>

      {/* Activity Segmented Tabs (Tactile Neomorphic) */}
      <div
        role="tablist"
        aria-label="Activity Categories"
        className="inline-flex p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] neomorph-inset"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'discussions'}
          onClick={() => setActiveTab('discussions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'discussions'
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Package className="w-4 h-4 text-indigo-500" />
          <span>My Products & Discussions ({myPosts.length})</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'saved'}
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'saved'
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Bookmark className="w-4 h-4 text-amber-500" />
          <span>Saved Discussions ({savedPosts.length})</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'upvoted'}
          onClick={() => setActiveTab('upvoted')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'upvoted'
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ChevronUp className="w-4 h-4 text-emerald-500" />
          <span>Upvoted Discussions ({upvotedPosts.length})</span>
        </button>
      </div>

      {/* Stream by Tab */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : activeTab === 'discussions' ? (
        <div className="space-y-4">
          {myPosts.length > 0 ? (
            myPosts.map((post) => (
              <div key={post.id} className="space-y-2">
                <PostCard post={post} />

                {/* Creator Research Studio Entry Point (Owner Only) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                      <Lock className="w-3.5 h-3.5" /> Creator Research Workspace
                    </span>
                    <span>·</span>
                    <span>{post.commentsCount} reviews available for synthesis</span>
                  </div>

                  <Link
                    to={`/posts/${post.id}?tab=insights`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Open Research Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="You haven't published any products yet"
              description="You are currently participating as a Community Reviewer. Launch your first product discussion to unlock your private Creator Research Studio, document ingestion, and automated PRD generation."
              actionText="Publish Your First Product"
              onAction={() => (window.location.href = '/create')}
            />
          )}
        </div>
      ) : activeTab === 'saved' ? (
        <div className="space-y-3">
          {savedPosts.length > 0 ? (
            savedPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyState
              title="No saved discussions"
              description="Click the bookmark icon on any discussion or product to track its feedback here."
              actionText="Browse Community Discussions"
              onAction={() => (window.location.href = '/')}
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {upvotedPosts.length > 0 ? (
            upvotedPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyState
              title="No upvoted discussions"
              description="Discussions you upvote in the community feed will appear here for easy reference."
              actionText="Explore Trending Discussions"
              onAction={() => (window.location.href = '/explore')}
            />
          )}
        </div>
      )}
    </div>
  );
};
