import React from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  MessageSquare,
  MessageSquareCheck,
  ChevronUp,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { Product } from '../../types';
import { Badge } from '../common/Badge';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Generate a distinct gradient based on the product name
  const getGradient = (name: string) => {
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
  };

  const domain = product.productUrl
    ? product.productUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : null;

  return (
    <div className="neomorph-card p-5 flex flex-col justify-between h-full hover:border-indigo-400/50 dark:hover:border-indigo-500/50 group">
      <div>
        {/* Top Header: Logo, Name, Category */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getGradient(
                product.name
              )} flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0`}
            >
              {product.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <Link
                to={`/products/${product.id}`}
                className="font-bold text-base text-[var(--text-primary)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block"
              >
                {product.name}
              </Link>
              {domain && (
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span>{domain}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <Badge variant="outline" size="sm" className="shrink-0 font-medium">
            {product.category}
          </Badge>
        </div>

        {/* Tagline / Description */}
        <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-4">
          {product.tagline || product.description}
        </p>

        {/* Key Features Chips (if available) */}
        {product.features && product.features.length > 0 && (
          <div className="space-y-1.5 mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-500" /> Key Features
            </div>
            <div className="flex flex-wrap gap-1.5">
              {product.features.slice(0, 3).map((f: string, i: number) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-subtle)] truncate max-w-[220px]"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics & Actions */}
      <div className="pt-4 mt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
        {/* Real Metrics */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span
            className="flex items-center gap-1 font-semibold text-[var(--text-primary)]"
            title={`${product.upvotesCount} community upvotes`}
          >
            <ChevronUp className="w-4 h-4 text-indigo-500" />
            {product.upvotesCount}
          </span>
          <span>·</span>
          <span
            className="flex items-center gap-1"
            title={`${product.totalReviews} total community comments/reviews`}
          >
            <MessageSquareCheck className="w-3.5 h-3.5 text-emerald-500" />
            {product.totalReviews} {product.totalReviews === 1 ? 'review' : 'reviews'}
          </span>
          <span>·</span>
          <span
            className="flex items-center gap-1"
            title={`${product.discussionCount} active discussions`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
            {product.discussionCount}
          </span>
        </div>

        {/* Navigation Action */}
        <Link
          to={`/products/${product.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group-hover:translate-x-0.5 duration-150"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
