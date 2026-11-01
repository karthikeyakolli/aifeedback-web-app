import React from 'react';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORIES = [
  'All',
  'Productivity',
  'Developer Tools',
  'AI & Machine Learning',
  'Design & UX',
  'SaaS & B2B',
  'Mobile Apps',
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="Filter by category"
      className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs"
    >
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelectCategory(cat)}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer select-none ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};
