import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Compass,
  Layers,
  MessageSquare,
  X,
  Tag,
  ArrowUpDown,
} from 'lucide-react';
import type { Post } from '../types';
import { api } from '../services/api';
import { extractProductsFromPosts } from '../lib/products';
import { ProductCard } from '../components/product/ProductCard';
import { PostCard } from '../components/feed/PostCard';
import { EmptyState } from '../components/common/EmptyState';
import { CategoryFilter } from '../components/feed/CategoryFilter';

type ExploreView = 'products' | 'discussions';

export const ExplorePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ExploreView>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'discussed' | 'recent'>('popular');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getPosts()
      .then((data) => setPosts(data))
      .catch((err) => console.error('Failed to load posts:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Extract products from posts
  const products = useMemo(() => extractProductsFromPosts(posts), [posts]);

  // Extract unique tags
  const allTags = useMemo(() => Array.from(new Set(posts.flatMap((p) => p.tags || []))), [posts]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let res = [...products];

    if (selectedCategory !== 'All') {
      res = res.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    if (selectedTag) {
      res = res.filter((p) => p.tags && p.tags.includes(selectedTag));
    }

    // Sort
    if (sortBy === 'popular') {
      res.sort((a, b) => b.upvotesCount - a.upvotesCount);
    } else if (sortBy === 'discussed') {
      res.sort((a, b) => b.totalReviews - a.totalReviews);
    } else if (sortBy === 'recent') {
      res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return res;
  }, [products, selectedCategory, searchQuery, selectedTag, sortBy]);

  // Filtered discussions
  const filteredDiscussions = useMemo(() => {
    let res = [...posts];

    if (selectedCategory !== 'All') {
      res = res.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    if (selectedTag) {
      res = res.filter((p) => p.tags && p.tags.includes(selectedTag));
    }

    if (sortBy === 'popular') {
      res.sort((a, b) => b.upvotesCount - a.upvotesCount);
    } else if (sortBy === 'discussed') {
      res.sort((a, b) => b.commentsCount - a.commentsCount);
    } else if (sortBy === 'recent') {
      res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return res;
  }, [posts, selectedCategory, searchQuery, selectedTag, sortBy]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5 uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>Product Discovery & Reviews</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Explore Products & Discussions
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Discover working developer tools, SaaS applications, and MVPs seeking candid community critique.
        </p>
      </div>

      {/* Discovery Mode Switcher & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* View Segmented Switcher (Tactile Neomorphic) */}
          <div
            role="tablist"
            aria-label="Discovery View"
            className="inline-flex p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] neomorph-inset self-start"
          >
            <button
              role="tab"
              aria-selected={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Products ({products.length})</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'discussions'}
              onClick={() => setActiveTab('discussions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'discussions'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>Discussions ({posts.length})</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] self-end sm:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="font-medium hidden sm:inline">Sort:</span>
            <div className="inline-flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0.5 text-xs">
              <button
                onClick={() => setSortBy('popular')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  sortBy === 'popular'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => setSortBy('discussed')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  sortBy === 'discussed'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Most Reviews
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  sortBy === 'recent'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Recent
              </button>
            </div>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'products'
                ? 'Search products by name, problem space, or technology stack...'
                : 'Search discussions by title, author, or keyword...'
            }
            aria-label="Search discovery catalog"
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

        {/* Category Pills Filter */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* Popular Topic Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3 text-indigo-500" /> Tags:
            </span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-medium cursor-pointer"
              >
                Clear #{selectedTag} ✕
              </button>
            )}
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`text-[11px] px-2.5 py-0.5 rounded-md border transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Active Filters Summary */}
        {(searchQuery || selectedCategory !== 'All' || selectedTag) && (
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1 pt-1">
            <span>
              Showing{' '}
              {activeTab === 'products' ? filteredProducts.length : filteredDiscussions.length}{' '}
              {activeTab === 'products' ? 'products' : 'discussions'}
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedTag && ` tagged #${selectedTag}`}
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedTag(null);
              }}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Catalog */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-[var(--border-subtle)] animate-pulse"
            />
          ))}
        </div>
      ) : activeTab === 'products' ? (
        filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              searchQuery
                ? `No products found matching "${searchQuery}"`
                : `No products in category "${selectedCategory}"`
            }
            description="Try modifying your keyword query or browse across all product categories."
            actionText="Reset Search"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedTag(null);
            }}
          />
        )
      ) : filteredDiscussions.length > 0 ? (
        <div className="space-y-3">
          {filteredDiscussions.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No discussions found"
          description="Try broadening your search or starting a new review discussion."
          actionText="Reset Search"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('All');
            setSelectedTag(null);
          }}
        />
      )}
    </div>
  );
};
