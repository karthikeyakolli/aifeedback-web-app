import React from 'react';
import { cn } from '../../lib/utils';
import { UserX, AlertCircle, CheckCircle2, Lightbulb, Split } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'anonymous' | 'complaint' | 'praise' | 'feature' | 'friction' | 'outline' | 'ai';
  size?: 'sm' | 'md';
  className?: string;
  icon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  icon = false,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60',
    anonymous: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80',
    complaint: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50',
    praise: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50',
    feature: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50',
    friction: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50',
    ai: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-medium',
    outline: 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-transparent',
  };

  const renderIcon = () => {
    if (!icon) return null;
    switch (variant) {
      case 'anonymous':
        return <UserX className="w-3 h-3 mr-1 inline" />;
      case 'complaint':
        return <AlertCircle className="w-3 h-3 mr-1 inline" />;
      case 'praise':
        return <CheckCircle2 className="w-3 h-3 mr-1 inline" />;
      case 'feature':
        return <Lightbulb className="w-3 h-3 mr-1 inline" />;
      case 'friction':
        return <Split className="w-3 h-3 mr-1 inline" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full tracking-tight transition-colors',
        sizeClasses,
        variantStyles[variant],
        className
      )}
    >
      {renderIcon()}
      {children}
    </span>
  );
};
