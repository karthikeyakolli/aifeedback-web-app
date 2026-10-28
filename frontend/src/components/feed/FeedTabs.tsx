import React from 'react';
import { Flame, Clock, MessageSquareText } from 'lucide-react';

interface FeedTabsProps {
  currentSort: string;
  onSelectSort: (sort: string) => void;
}

export const FeedTabs: React.FC<FeedTabsProps> = ({ currentSort, onSelectSort }) => {
  const tabs = [
    { id: 'trending', label: 'Trending', icon: <Flame className="w-4 h-4" /> },
    { id: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" /> },
    { id: 'comments', label: 'Most Discussed', icon: <MessageSquareText className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
      {tabs.map((tab) => {
        const isActive = currentSort === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectSort(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer ${
              isActive
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
