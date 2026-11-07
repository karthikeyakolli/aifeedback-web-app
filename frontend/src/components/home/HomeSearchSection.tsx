import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, MessageSquare, ThumbsUp, ArrowRight } from 'lucide-react';
import type { PublicProject } from '../../types';
import { formatCategoryLabel } from '../../lib/utils';

interface HomeSearchSectionProps {
  projects: PublicProject[];
  onCategorySelect?: (cat: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Domains' },
  { id: 'developer-tools', label: 'Developer Tools' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'ai-ml', label: 'AI & Machine Learning' },
  { id: 'design-ux', label: 'Design & UX' },
  { id: 'saas-b2b', label: 'Business & SaaS' },
  { id: 'mobile', label: 'Mobile Apps' },
  { id: 'infrastructure', label: 'Infrastructure' },
];

export const HomeSearchSection: React.FC<HomeSearchSectionProps> = ({ projects }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState<'trending' | 'most_discussed' | 'newest'>('trending');

  const filteredProjects = useMemo(() => {
    let list = [...projects];

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.creatorDisplayName && p.creatorDisplayName.toLowerCase().includes(q))
      );
    }

    switch (selectedSort) {
      case 'most_discussed':
        return list.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
      case 'newest':
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'trending':
      default:
        return list.sort((a, b) => {
          const scoreA = (a.upvotesCount || 0) * 2 + (a.reviewsCount || 0) * 3;
          const scoreB = (b.upvotesCount || 0) * 2 + (b.reviewsCount || 0) * 3;
          return scoreB - scoreA;
        });
    }
  }, [projects, selectedCategory, searchQuery, selectedSort]);

  return (
    <section className="w-full py-14 border-b border-[var(--border-default)]/60 bg-[var(--surface-raised)]/10" aria-label="Search and Explore">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search & Explore</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Find the right tools, discussions, and releases
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Live filter across applications, feedback threads, and developer communities.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, keywords, problem domain, or creator..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 shadow-sm text-sm transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar: Category Pills & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'bg-[var(--surface)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-hidden cursor-pointer"
            >
              <option value="trending">Trending First</option>
              <option value="most_discussed">Most Discussed</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Results Grid */}
        {filteredProjects.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[var(--border-default)] rounded-2xl bg-[var(--surface)]/50">
            <p className="text-sm font-semibold text-[var(--text-primary)]">No matching projects found</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Try clearing your filters or search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:shadow-lg transition-all flex flex-col justify-between group text-left"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-sm shrink-0">
                      {project.name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                      {formatCategoryLabel(project.category)}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-1 truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-4">
                    {project.tagline || project.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]/60 text-xs text-[var(--text-muted)]">
                  <span className="truncate">by {project.creatorDisplayName || project.creatorUsername || 'Builder'}</span>
                  <div className="flex items-center gap-3 shrink-0 font-medium">
                    <span className="flex items-center gap-1 text-[var(--accent)]">
                      <MessageSquare className="w-3 h-3" />
                      {project.reviewsCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {project.upvotesCount || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {filteredProjects.length > 6 && (
          <div className="text-center mt-8">
            <Link
              to={`/explore?category=${selectedCategory}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer shadow-xs"
            >
              <span>Explore all {filteredProjects.length} projects in this category</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)]" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
