import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5 min-h-[34px]',
    md: 'px-4 py-2 text-sm font-medium rounded-xl gap-2 min-h-[40px]',
    lg: 'px-5 py-2.5 text-base font-medium rounded-xl gap-2.5 min-h-[44px]',
  };

  const variantStyles = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs dark:bg-indigo-600 dark:hover:bg-indigo-500 border border-indigo-700/50 dark:border-indigo-500/50 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-500',
    secondary:
      'bg-[var(--bg-secondary)] hover:bg-slate-200 text-[var(--text-primary)] dark:hover:bg-slate-700/60 border border-[var(--border-subtle)] active:scale-[0.98]',
    outline:
      'border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] active:scale-[0.98]',
    ghost:
      'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs dark:bg-rose-600 dark:hover:bg-rose-500 active:scale-[0.98]',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
