import React from 'react';
import { Flame, Clock, MessageSquareText } from 'lucide-react';

interface FeedTabsProps {
  currentSort: string;
  onSelectSort: (sort: string) => void;
}

export const FeedTabs: React.FC<FeedTabsProps> = ({ currentSort, onSelectSort }) => {
  const tabs = [
    { id: 'trending', label: 'Popular', icon: <Flame className="w-4 h-4 text-amber-500" /> },
    { id: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4 text-blue-500" /> },
    { id: 'comments', label: 'Most Discussed', icon: <MessageSquareText className="w-4 h-4 text-emerald-500" /> },
  ];

  return (
    <div
      role="tablist"
      aria-label="Feed sorting options"
      className="inline-flex p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] neomorph-inset"
    >
      {tabs.map((tab) => {
        const isActive = currentSort === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectSort(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              isActive
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
