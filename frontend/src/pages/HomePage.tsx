import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Search,
  X,
  HelpCircle,
  Package,
  ShieldCheck,
  Tag,
  Rocket,
  ArrowRight,
  UserCheck,
  Crown,
  Radio,
  GitCompare,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import type { Post } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { extractProductsFromPosts } from '../lib/products';
import { PostCard } from '../components/feed/PostCard';
import { CategoryFilter } from '../components/feed/CategoryFilter';
import { FeedTabs } from '../components/feed/FeedTabs';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { FeedSkeleton } from '../components/common/LoadingSkeletons';

const LIVE_ACTIVITIES = [
  { icon: '🔥', text: 'Sarah Chen published Review V2 for ReflectAI • 89% evidence sample coverage' },
  { icon: '🎙️', text: 'Alex & Jordan synthesized dual-host podcast briefing in 1.3s' },
  { icon: '⚡', text: 'BM25 engine indexed 142 PDF specification chunks without hallucination' },
  { icon: '💬', text: 'Elena Vance grounded 4 UX accessibility friction points in thread' },
  { icon: '🚀', text: 'Marcus Lee exported 3 roadmap tickets directly to Linear format' },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPostType, setSelectedPostType] = useState<string>('all');

  // Distinguish Publisher (has created >= 1 product discussion) vs Reviewer (has created 0)
  const userPublishedPosts = useMemo(() => {
    if (!user) return [];
    return posts.filter(
      (p) => p.author?.id === user.id || p.author?.username === user.username
    );
  }, [posts, user]);

  const isPublisher = Boolean(user && userPublishedPosts.length > 0);
  const isReviewerOnly = Boolean(user && userPublishedPosts.length === 0);

  // Live real-time activity ticker index
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % LIVE_ACTIVITIES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  // Social Translucence & First-Time Visitor Onboarding (Cho & Wash, 2021)
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('pri_hide_onboarding') !== 'true';
  });

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('pri_hide_onboarding', 'true');
  };

  useEffect(() => {
    setIsLoading(true);
    api.getPosts(category, sort)
      .then((data) => setPosts(data))
      .catch((err) => console.error('Failed to fetch posts:', err))
      .finally(() => setIsLoading(false));
  }, [category, sort]);

  // Extract products for contextual discovery
  const featuredProducts = useMemo(() => {
    return extractProductsFromPosts(posts).slice(0, 3);
  }, [posts]);

  // Extract top tags
  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) {
      for (const t of p.tags || []) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [posts]);

  // Client-side text & post-type filter
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Audio Ready tab filter
      if (sort === 'audio' && !post.hasAiAnalysis) {
        return false;
      }
      // Post Type Filter
      if (selectedPostType !== 'all' && post.postType !== selectedPostType) {
        return false;
      }
      // Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = post.title.toLowerCase().includes(q);
        const matchDesc = post.description.toLowerCase().includes(q);
        const matchCategory = post.category.toLowerCase().includes(q);
        const matchTags = (post.tags || []).some((t) => t.toLowerCase().includes(q));
        return matchTitle || matchDesc || matchCategory || matchTags;
      }
      return true;
    });
  }, [posts, selectedPostType, searchQuery, sort]);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* 0. Live Real-Time Activity Ticker Pill */}
      <div className="flex items-center justify-between px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs text-xs">
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0">
            Live Stream
          </span>
          <span className="text-[var(--text-muted)] text-[11px] truncate animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="mr-1">{LIVE_ACTIVITIES[tickerIdx].icon}</span>
            {LIVE_ACTIVITIES[tickerIdx].text}
          </span>
        </div>

        <Link
          to="/posts/post_reflect_01?tab=insights"
          className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 shrink-0 pl-2"
        >
          <span>Demo Lab</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 1. Global Commercial Hero Banner & Value Proposition */}
      {(!user || showOnboarding) && (
        <section
          aria-label="ResearchIntel Product Launchpad"
          className="relative p-6 sm:p-10 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/90 via-[var(--bg-surface)] to-purple-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/20 shadow-md transition-all overflow-hidden"
        >
          {/* Ambient Glow Orb */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full pointer-events-none" />

          {user && (
            <button
              onClick={dismissOnboarding}
              aria-label="Dismiss hero banner"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100/90 dark:bg-indigo-950/90 text-indigo-700 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>ResearchIntel 2.0 • The AI Product Intelligence Network</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)] leading-[1.15]">
              Where Breakthrough Products Are Forged by Community Truth
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl">
              Turn raw, unvarnished user critique into grounded roadmap decisions. Combines <strong>NotebookLM-style 13-section reviews</strong>, <strong>dual-host podcast briefings</strong>, and <strong>1-click Linear issue export</strong>.
            </p>

            {/* Quick Hero CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/create">
                <Button
                  size="md"
                  variant="primary"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold shadow-md h-10 px-5 rounded-xl cursor-pointer"
                  leftIcon={<Rocket className="w-4 h-4 text-amber-300" />}
                >
                  Launch Your Product Discussion
                </Button>
              </Link>

              <Link to="/posts/post_reflect_01?tab=insights">
                <Button
                  size="md"
                  variant="outline"
                  className="font-bold border-indigo-300 dark:border-indigo-700 h-10 px-4 rounded-xl cursor-pointer"
                  leftIcon={<Radio className="w-4 h-4 text-purple-500" />}
                >
                  Listen to Audio Briefing
                </Button>
              </Link>
            </div>

            {/* 4-Tile Bento Superpowers Showcase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
              <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)]/90 border border-[var(--border-subtle)] shadow-2xs space-y-1.5 hover:border-indigo-400/50 transition-colors">
                <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                  <Radio className="w-4 h-4 text-purple-500" />
                  <span>Dual-Host Audio</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Listen to feedback synthesized as an interactive 2-host podcast with live transcript seeking.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)]/90 border border-[var(--border-subtle)] shadow-2xs space-y-1.5 hover:border-indigo-400/50 transition-colors">
                <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                  <GitCompare className="w-4 h-4 text-indigo-500" />
                  <span>Evolution Diff</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Compare V1 vs V2 milestones. Visually track resolved friction and newly emerged user complaints.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)]/90 border border-[var(--border-subtle)] shadow-2xs space-y-1.5 hover:border-indigo-400/50 transition-colors">
                <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>13-Section Review</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Grounded in SQLite & BM25 with frozen citations. Zero hallucinations or fake counts.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)]/90 border border-[var(--border-subtle)] shadow-2xs space-y-1.5 hover:border-indigo-400/50 transition-colors">
                <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span>1-Click Issue Sync</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Turn verified user friction into pre-formatted Linear and GitHub roadmap tickets instantly.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Differentiated Experience: Project Publisher / Owner View */}
      {isPublisher && (
        <section
          aria-label="Creator Studio Command Center"
          className="relative p-6 sm:p-7 rounded-3xl border border-indigo-200/90 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-50/80 via-[var(--bg-surface)] to-purple-50/40 dark:from-indigo-950/40 dark:via-[var(--bg-surface)] dark:to-purple-950/20 shadow-sm transition-all neomorph-card"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                <Crown className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
                    Creator Command Center
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    👑 Verified Publisher
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Welcome back, <strong>{user?.displayName}</strong> (@{user?.username}). You have <strong>{userPublishedPosts.length}</strong> active published product discussions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/create">
                <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Publish Another App
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Access to Creator's Published Applications and AI Studios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userPublishedPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 flex flex-col justify-between gap-3 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {post.category}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active Feedback
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-1">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-1.5">
                    <span>💬 <strong>{post.commentsCount}</strong> Community Reviews</span>
                    <span>·</span>
                    <span>▲ <strong>{post.upvotesCount}</strong> Upvotes</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
                  <Link to={`/posts/${post.id}?tab=insights`} className="flex-1">
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xs"
                      leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                    >
                      Open Creator AI Studio
                    </Button>
                  </Link>
                  <Link to={`/posts/${post.id}`}>
                    <Button size="sm" variant="ghost" className="px-2.5 text-xs">
                      View Post
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Differentiated Experience: Community Reviewer / Contributor View */}
      {isReviewerOnly && (
        <section
          aria-label="Community Contributor Hub"
          className="relative p-6 sm:p-7 rounded-3xl border border-teal-200/90 dark:border-teal-900/60 bg-gradient-to-br from-teal-50/70 via-[var(--bg-surface)] to-emerald-50/30 dark:from-teal-950/30 dark:via-[var(--bg-surface)] dark:to-emerald-950/20 shadow-sm transition-all neomorph-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
                    Community Contributor Hub
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                    ★ Peer Reviewer (Score: {user?.reputationScore})
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Welcome, <strong>{user?.displayName}</strong> (@{user?.username}). You are viewing the community as an active reviewer and beta tester.
                </p>
              </div>
            </div>

            <Link to="/create" className="shrink-0">
              <Button size="sm" variant="primary" leftIcon={<Rocket className="w-3.5 h-3.5" />}>
                Publish Your App
              </Button>
            </Link>
          </div>

          {/* Invitation Card Explaining the Publisher Upgrade & Benefits */}
          <div className="p-4 rounded-2xl border border-teal-200 dark:border-teal-800 bg-[var(--bg-surface)]/90 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Want candid peer reviews and a private AI Research Studio?
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Publishing your application or prototype turns you into a <strong>Verified Creator</strong>, unlocking private document ingestion (PDF/MD), multi-agent AI research, and automated PRD generation from community feedback.
              </p>
            </div>
            <Link to="/create" className="shrink-0">
              <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Start New Project Discussion
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Discovery & Feed Filters */}
      <section className="space-y-4">
        {/* Search Bar & Quick Creation */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions by topic, title, description, or tags..."
              aria-label="Search discussions"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/create" className="shrink-0">
              <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                New Discussion
              </Button>
            </Link>
            {!showOnboarding && (
              <button
                onClick={() => setShowOnboarding(true)}
                title="Show community guide"
                aria-label="Show community guide"
                className="p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Feed Sorting Tabs (Tactile Neomorphic) */}
        <FeedTabs currentSort={sort} onSelectSort={setSort} />

        {/* Post Type / Intent Filtering Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[var(--text-muted)] font-semibold mr-1">Intent:</span>
          {[
            { id: 'all', label: 'All Discussions' },
            { id: 'product_review', label: 'Product Reviews' },
            { id: 'idea_critique', label: 'Idea Critiques' },
            { id: 'problem_discovery', label: 'Problem Discovery' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedPostType(type.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedPostType === type.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Category Pills Filter */}
        <CategoryFilter selectedCategory={category} onSelectCategory={setCategory} />

        {/* Active Filters Summary */}
        {(searchQuery || selectedPostType !== 'all' || category !== 'All') && (
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1 pt-1">
            <span>
              Showing {filteredPosts.length}{' '}
              {filteredPosts.length === 1 ? 'discussion' : 'discussions'}
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedPostType !== 'all' && ` in ${selectedPostType.replace('_', ' ')}`}
              {category !== 'All' && ` in ${category}`}
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedPostType('all');
                setCategory('All');
              }}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      {/* Responsive Feed Layout with Desktop Discovery Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed Column (Full width on mobile, 2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <FeedSkeleton />
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyState
              title={
                searchQuery
                  ? `No discussions matching "${searchQuery}"`
                  : `No discussions found in "${category}"`
              }
              description="Adjust your search terms or be the first to publish a product feedback or idea request."
              actionText="Start a New Discussion"
              onAction={() => navigate('/create')}
            />
          )}
        </div>

        {/* Desktop Contextual Discovery Panel (Hidden on mobile < 1024px to prevent clutter) */}
        <aside className="hidden lg:block space-y-5">
          {/* Featured Products Seeking Review */}
          <div className="neomorph-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-500" /> Products Under Review
              </h2>
              <Link
                to="/explore"
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-3">
              {featuredProducts.map((prod) => (
                <Link
                  key={prod.id}
                  to={`/products/${prod.id}`}
                  className="block p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-indigo-400/50 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {prod.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] font-medium">
                      {prod.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 leading-snug">
                    {prod.tagline}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--text-muted)]">
                    <span>{prod.upvotesCount} votes</span>
                    <span>·</span>
                    <span>{prod.totalReviews} reviews</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Trending Topic Tags */}
          {trendingTags.length > 0 && (
            <div className="neomorph-card p-5 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-500" /> Trending Topics
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {trendingTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSearchQuery(t)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Review Guidelines Notice (Social Translucence & Civil Etiquette) */}
          <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] space-y-2">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Reviewer Guidelines
            </div>
            <p className="leading-relaxed text-[11px]">
              Feedback is most impactful when specific: explain the friction you encountered, why it matters, and how you would improve the flow.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
