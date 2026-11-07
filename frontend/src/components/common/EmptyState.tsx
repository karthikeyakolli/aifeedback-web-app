import React from 'react';
import { cn } from '../../lib/utils';
import { MessageSquareDashed } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface-raised)]/40',
        className
      )}
    >
      <div className="w-11 h-11 rounded-full bg-[var(--surface)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] mb-3 shadow-2xs">
        {icon || <MessageSquareDashed className="w-5 h-5 text-[var(--text-muted)]" />}
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
