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
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    anonymous: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
    complaint: 'bg-rose-50 text-rose-700 border border-rose-200',
    praise: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    feature: 'bg-sky-50 text-sky-700 border border-sky-200',
    friction: 'bg-amber-50 text-amber-800 border border-amber-200',
    ai: 'bg-blue-50 text-[var(--accent)] border border-blue-200 font-medium',
    outline: 'border border-slate-200 text-slate-600 bg-transparent',
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
