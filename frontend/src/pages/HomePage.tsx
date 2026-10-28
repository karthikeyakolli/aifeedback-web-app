import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Plus } from 'lucide-react';
import type { Post } from '../types';
import { api } from '../services/api';
import { PostCard } from '../components/feed/PostCard';
import { CategoryFilter } from '../components/feed/CategoryFilter';
import { FeedTabs } from '../components/feed/FeedTabs';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';

export const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('trending');

  useEffect(() => {
    setIsLoading(true);
    api.getPosts(category, sort)
      .then((data) => setPosts(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [category, sort]);

  return (
    <div className="space-y-6">
      {/* Editorial Hero Banner */}
      <section className="p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-blue-950/20 dark:via-[#0c101d] dark:to-[#0c101d] shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Product Research Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-3">
            Anonymous Community Feedback Grounded by AI Research
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
            Publish products, ideas, and review requests. Receive authentic anonymous community feedback. Our integrated AI synthesizes recurring themes, tensions, and validation experiments with verifiable citations.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/create">
              <Button size="md" leftIcon={<Plus className="w-4 h-4" />}>
                Request Product Review
              </Button>
            </Link>
            <Link to="/explore">
              <Button variant="outline" size="md">
                Explore Discussions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feed Controls */}
      <div className="space-y-3">
        <FeedTabs currentSort={sort} onSelectSort={setSort} />
        <CategoryFilter selectedCategory={category} onSelectCategory={setCategory} />
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111625] animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No discussions found in "${category}"`}
          description="Be the first to publish a product or idea review request in this category."
          actionText="Create Post"
          onAction={() => (window.location.href = '/create')}
        />
      )}
    </div>
  );
};
