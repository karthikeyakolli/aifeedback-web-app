import React, { useState, useEffect } from 'react';
import { Search, Compass, Tag } from 'lucide-react';
import type { Post } from '../types';
import { api } from '../services/api';
import { PostCard } from '../components/feed/PostCard';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';

const CATEGORY_CARDS = [
  { name: 'Productivity', desc: 'Task velocity, note taking, keyboard workflows', count: 18 },
  { name: 'Developer Tools', desc: 'CLIs, databases, SDKs, developer experience', count: 24 },
  { name: 'AI & Machine Learning', desc: 'LLM agents, fine-tuning, RAG, prompt UX', count: 31 },
  { name: 'Design & UX', desc: 'Wireframes, design systems, design critiques', count: 12 },
  { name: 'SaaS & B2B', desc: 'Enterprise software, pricing, compliance, sales', count: 15 },
  { name: 'Mobile Apps', desc: 'iOS, Android, React Native, mobile ergonomics', count: 9 },
];

export const ExplorePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    api.getPosts().then((data) => {
      setPosts(data);
      setFilteredPosts(data);
    });
  }, []);

  useEffect(() => {
    let res = [...posts];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (selectedTag) {
      res = res.filter((p) => p.tags.includes(selectedTag));
    }
    setFilteredPosts(res);
  }, [searchQuery, selectedTag, posts]);

  // Extract all unique tags
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
          Explore Product Discussions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Search across products, feature requests, and community review discussions.
        </p>

        <div className="relative max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords, problems, or technologies (e.g. SQLite, onboarding, pricing)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111625] text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Category Grid */}
      {!searchQuery && !selectedTag && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-500" />
            Browse Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORY_CARDS.map((cat) => (
              <Card
                key={cat.name}
                hoverable
                onClick={() => setSearchQuery(cat.name)}
                className="p-4 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {cat.count} posts
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {cat.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tags Cloud */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-blue-500" />
          Popular Topic Tags
        </h2>
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 font-medium cursor-pointer"
            >
              Clear tag: {selectedTag} ✕
            </button>
          )}
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Results ({filteredPosts.length})
          </h2>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matching discussions found"
            description="Try searching with different keywords or clearing tag filters."
            actionText="Reset Search"
            onAction={() => {
              setSearchQuery('');
              setSelectedTag(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
