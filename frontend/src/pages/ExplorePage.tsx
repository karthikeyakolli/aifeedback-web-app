import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Compass,
  Layers,
  MessageSquare,
  X,
  ArrowUpDown,
} from 'lucide-react';
import type { Post, PublicProject } from '../types';
import { api } from '../services/api';
import { PublicProjectCard } from '../components/public/PublicProjectCard';
import { PostCard } from '../components/feed/PostCard';
import { EmptyState } from '../components/common/EmptyState';
import { CategoryFilter } from '../components/feed/CategoryFilter';

type ExploreView = 'projects' | 'discussions';

export const ExplorePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ExploreView>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'discussed' | 'recent'>('popular');

  // Real backend public projects
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([]);
  // Legacy discussions for community tab
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Public Projects & Discussions
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const categoryParam = selectedCategory !== 'All' ? selectedCategory : undefined;
    const searchParam = searchQuery.trim() || undefined;

    Promise.allSettled([
      api.getPublicProjects({
        category: categoryParam,
        search: searchParam,
      }),
      api.getPosts(),
    ])
      .then(([projRes, postsRes]) => {
        if (!isMounted) return;
        if (projRes.status === 'fulfilled') {
          setPublicProjects(projRes.value);
        }
        if (postsRes.status === 'fulfilled') {
          setPosts(postsRes.value);
        }
      })
      .catch((err) => console.error('Failed to load explore data:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchQuery]);

  // Client-side Sort on Public Projects
  const sortedProjects = useMemo(() => {
    const list = [...publicProjects];
    if (sortBy === 'popular') {
      list.sort((a, b) => b.upvotesCount - a.upvotesCount);
    } else if (sortBy === 'discussed') {
      list.sort((a, b) => b.reviewsCount - a.reviewsCount);
    } else if (sortBy === 'recent') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [publicProjects, sortBy]);

  // Filtered discussions
  const filteredDiscussions = useMemo(() => {
    let res = [...posts];

    if (selectedCategory !== 'All') {
      res = res.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
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

  const handleUpvoteChange = (projectId: string, upvotesCount: number) => {
    setPublicProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, upvotesCount } : p))
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] mb-1.5 uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>Public Discovery & AI Scrutiny</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Explore Projects & AI Feedback
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Discover verified developer tools, applications, and architectures seeking rigorous technical critique and community validation.
        </p>
      </div>

      {/* Discovery Mode Switcher & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* View Segmented Switcher */}
          <div
            role="tablist"
            aria-label="Discovery View"
            className="inline-flex p-1 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] self-start"
          >
            <button
              role="tab"
              aria-selected={activeTab === 'projects'}
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Public Projects ({sortedProjects.length})</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'discussions'}
              onClick={() => setActiveTab('discussions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'discussions'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
              <span>Community Discussions ({filteredDiscussions.length})</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] self-end sm:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="font-medium hidden sm:inline">Sort:</span>
            <div className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--surface)] p-0.5 text-xs">
              <button
                onClick={() => setSortBy('popular')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  sortBy === 'popular'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Most Upvoted
              </button>
              <button
                onClick={() => setSortBy('discussed')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  sortBy === 'discussed'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Most Reviews
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
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
              activeTab === 'projects'
                ? 'Search public projects by title, tagline, architecture, or category...'
                : 'Search community discussions by title, author, or keyword...'
            }
            aria-label="Search discovery catalog"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-xs transition-all"
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

        {/* Category Filter Pills */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* Active Filters Summary */}
        {(searchQuery || selectedCategory !== 'All' || selectedTag) && (
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1 pt-1">
            <span>
              Showing{' '}
              {activeTab === 'projects' ? sortedProjects.length : filteredDiscussions.length}{' '}
              {activeTab === 'projects' ? 'public projects' : 'discussions'}
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
              className="text-[var(--accent)] font-bold hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Catalog */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] animate-pulse"
            />
          ))}
        </div>
      ) : activeTab === 'projects' ? (
        sortedProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {sortedProjects.map((project) => (
              <PublicProjectCard
                key={project.id}
                project={project}
                onUpvoteChange={handleUpvoteChange}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              searchQuery
                ? `No public projects found matching "${searchQuery}"`
                : selectedCategory !== 'All'
                ? `No public projects published in "${selectedCategory}"`
                : 'No projects published yet'
            }
            description={
              searchQuery || selectedCategory !== 'All'
                ? 'Try modifying your keyword query or browse across all project categories.'
                : 'Be the first developer to publish a project and receive community and AI review scrutiny.'
            }
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
