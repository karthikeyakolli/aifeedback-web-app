import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`bg-slate-200/80 dark:bg-slate-800/80 rounded-md motion-safe:animate-pulse ${className}`}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading card content"
      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151D2E] space-y-3.5 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-16 h-5 rounded-full" />
          <Skeleton className="w-24 h-4 rounded-md" />
        </div>
        <Skeleton className="w-12 h-4 rounded-md" />
      </div>

      <Skeleton className="w-3/4 h-6 rounded-md" />
      <Skeleton className="w-full h-12 rounded-md" />

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex gap-2">
          <Skeleton className="w-12 h-4 rounded-md" />
          <Skeleton className="w-12 h-4 rounded-md" />
        </div>
        <Skeleton className="w-20 h-7 rounded-xl" />
      </div>
    </div>
  );
};

export const FeedSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div role="status" aria-label="Loading discussions" className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};

export const PageSkeleton: React.FC = () => {
  return (
    <div role="status" aria-label="Loading page" className="space-y-6 max-w-4xl mx-auto py-4">
      <div className="space-y-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-2/3 h-8 rounded-lg" />
        <Skeleton className="w-1/2 h-4" />
      </div>
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 4,
  columns = 4,
}) => {
  return (
    <div
      role="status"
      aria-label="Loading table"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151D2E] overflow-hidden"
    >
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-900/30">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-4" />
        ))}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="flex-1 h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const FormSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading form"
      className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151D2E] space-y-4 max-w-md mx-auto"
    >
      <Skeleton className="w-1/3 h-6 mb-2" />
      <div className="space-y-1.5">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-full h-10 rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-full h-10 rounded-xl" />
      </div>
      <Skeleton className="w-full h-11 rounded-xl pt-2" />
    </div>
  );
};

