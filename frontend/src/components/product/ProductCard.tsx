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
  const domain = product.productUrl
    ? product.productUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : null;

  return (
    <div className="relative p-5 flex flex-col justify-between h-full rounded-2xl border border-[var(--border-default)]/80 bg-[var(--surface)]/70 backdrop-blur-md hover:border-[var(--accent)]/50 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_32px_rgba(59,130,246,0.08)] hover:-translate-y-1 transition-all duration-300 group">
      <div>
        {/* Top Header: Logo, Name, Category */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:border-[var(--accent)]/40 transition-colors">
              {product.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <Link
                to={`/products/${product.id}`}
                className="font-bold text-sm sm:text-base text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate block"
              >
                {product.name}
              </Link>
              {domain && (
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors truncate max-w-[180px]"
                >
                  <span>{domain}</span>
                  <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                </a>
              )}
            </div>
          </div>

          <Badge variant="outline" size="sm" className="shrink-0 text-[11px] font-medium border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-secondary)]">
            {product.category}
          </Badge>
        </div>

        {/* Tagline / Description */}
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-3.5 font-normal">
          {product.tagline || product.description}
        </p>

        {/* Key Features Chips (if available) */}
        {product.features && product.features.length > 0 && (
          <div className="space-y-1.5 mb-3.5">
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <Layers className="w-3 h-3 text-[var(--text-muted)]" /> Key Features
            </div>
            <div className="flex flex-wrap gap-1.5">
              {product.features.slice(0, 3).map((f: string, i: number) => (
                <span
                  key={i}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border-default)] truncate max-w-[200px]"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics & Actions */}
      <div className="pt-3.5 mt-2 border-t border-[var(--border-default)]/60 flex items-center justify-between">
        {/* Real Metrics */}
        <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
          <span
            className="flex items-center gap-1 font-semibold text-[var(--text-primary)]"
            title={`${product.upvotesCount} community upvotes`}
          >
            <ChevronUp className="w-3.5 h-3.5 text-[var(--accent)]" />
            {product.upvotesCount}
          </span>
          <span>·</span>
          <span
            className="flex items-center gap-1"
            title={`${product.totalReviews} total community comments/reviews`}
          >
            <MessageSquareCheck className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            {product.totalReviews}
          </span>
          <span>·</span>
          <span
            className="flex items-center gap-1"
            title={`${product.discussionCount} active discussions`}
          >
            <MessageSquare className="w-3 h-3 text-[var(--text-muted)]" />
            {product.discussionCount}
          </span>
        </div>

        <Link
          to={`/products/${product.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline group-hover:translate-x-0.5 transition-transform"
        >
          <span>View</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
