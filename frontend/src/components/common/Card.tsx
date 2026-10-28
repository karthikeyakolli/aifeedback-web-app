import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111625] text-slate-900 dark:text-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all',
        hoverable &&
          'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
