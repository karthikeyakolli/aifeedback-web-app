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
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
              isSelected
                ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};
