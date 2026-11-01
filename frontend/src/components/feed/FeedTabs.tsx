import React from 'react';
import { Flame, Clock, MessageSquareText, Radio } from 'lucide-react';
import { playHapticPop } from '../../lib/haptics';

interface FeedTabsProps {
  currentSort: string;
  onSelectSort: (sort: string) => void;
}

export const FeedTabs: React.FC<FeedTabsProps> = ({ currentSort, onSelectSort }) => {
  const tabs = [
    { id: 'trending', label: 'Trending', icon: <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20" /> },
    { id: 'recent', label: 'Recent Launches', icon: <Clock className="w-4 h-4 text-indigo-500" /> },
    { id: 'comments', label: 'Most Discussed', icon: <MessageSquareText className="w-4 h-4 text-emerald-500" /> },
    { id: 'audio', label: 'Audio Ready', icon: <Radio className="w-4 h-4 text-purple-500 animate-pulse" /> },
  ];

  return (
    <div
      role="tablist"
      aria-label="Feed sorting options"
      className="inline-flex p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] neomorph-inset overflow-x-auto max-w-full"
    >
      {tabs.map((tab) => {
        const isActive = currentSort === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              playHapticPop(isActive ? 400 : 560);
              onSelectSort(tab.id);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
              isActive
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs scale-[1.02] border border-[var(--border-subtle)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/40'
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
