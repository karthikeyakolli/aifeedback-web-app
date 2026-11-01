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
        'rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--card-shadow)] transition-all',
        hoverable &&
          'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-[var(--card-shadow-hover)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
