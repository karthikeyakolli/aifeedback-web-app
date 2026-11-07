import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Clock,
  ThumbsUp,
} from 'lucide-react';
import type { PublicProject } from '../../types';
import { formatCategoryLabel } from '../../lib/utils';

interface ProductCarouselProps {
  title: string;
  subtitle: string;
  projects: PublicProject[];
  isLoading?: boolean;
  type: 'trending' | 'new' | 'most_discussed';
  viewAllLink?: string;
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  subtitle,
  projects,
  isLoading = false,
  type,
  viewAllLink = '/explore',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollContainerRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-amber-500" />;
      case 'new':
        return <Clock className="w-4 h-4 text-emerald-500" />;
      case 'most_discussed':
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <section className="w-full py-8 border-b border-[var(--border-default)]/60 relative group/section" aria-label={title}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">
              {getTypeIcon()}
              <span>{title}</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={viewAllLink}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline mr-2"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Scroll Navigation Controls */}
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="p-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="p-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Scroll Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          {isLoading ? (
            // Skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-72 sm:w-80 shrink-0 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-4 animate-pulse space-y-3"
              >
                <div className="w-full h-36 bg-[var(--surface-raised)] rounded-xl" />
                <div className="h-4 bg-[var(--surface-raised)] rounded w-3/4" />
                <div className="h-3 bg-[var(--surface-raised)] rounded w-1/2" />
              </div>
            ))
          ) : projects.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-muted)] w-full">
              No products found in this category yet.
            </div>
          ) : (
            projects.map((project) => {
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="w-72 sm:w-80 shrink-0 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:shadow-xs transition-all duration-200 flex flex-col overflow-hidden group/card text-left"
                >
                  {/* Product Cover Card Header */}
                  <div className="relative w-full h-32 bg-[var(--surface-raised)] p-4 flex flex-col justify-between overflow-hidden border-b border-[var(--border-default)]">
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-default)] shadow-2xs">
                        {formatCategoryLabel(project.category)}
                      </span>
                      {type === 'new' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Logo & Name inside cover */}
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-[var(--surface)] shadow-2xs flex items-center justify-center font-bold text-base text-[var(--accent)] border border-[var(--border-default)] shrink-0">
                        {project.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate group-hover/card:text-[var(--accent)] transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          by {project.creatorDisplayName || project.creatorUsername || 'Community Builder'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-4">
                      {project.tagline || project.description}
                    </p>

                    {/* Footer Metrics */}
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]/60 text-xs text-[var(--text-muted)]">
                      <div className="flex items-center gap-1.5 font-semibold text-[var(--accent)]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{project.reviewsCount || 0} discussions</span>
                      </div>

                      <div className="flex items-center gap-1 font-medium">
                        <ThumbsUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>{project.upvotesCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
