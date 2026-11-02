import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  'aria-label'?: string;
}

/**
 * Core Button Component (Spec 08_BUTTON_AND_CONTROL_CATALOG.md)
 *
 * Primary: One dominant action per screen/region, filled semantic accent surface.
 * Secondary: Important alternative, outline / restrained surface.
 * Ghost: Low emphasis / utility actions.
 * Destructive: Semantic danger surface for permanent actions with confirmation.
 * Icon-only: Square 40-44px touch target with mandatory accessible name.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      className,
      disabled,
      type = 'button',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    // Map 'danger' to 'destructive' for backward compatibility
    const effectiveVariant = variant === 'danger' ? 'destructive' : variant;

    // Accessibility check: Icon-only buttons must have an accessible name
    if (size === 'icon' && !ariaLabel && typeof children !== 'string') {
      console.warn('Button with size="icon" should provide an aria-label for accessibility.');
    }

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm,8px)] gap-1.5 min-h-[34px] min-w-[34px]',
      md: 'px-4 py-2 text-sm font-medium rounded-[var(--radius-md,10px)] gap-2 min-h-[40px]',
      lg: 'px-5 py-2.5 text-base font-semibold rounded-[var(--radius-md,10px)] gap-2.5 min-h-[44px]',
      icon: 'p-2.5 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] rounded-[var(--radius-md,10px)] justify-center',
    };

    const variantStyles = {
      primary:
        'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] border border-transparent shadow-xs hover:-translate-y-px active:translate-y-px focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)] transition-all duration-[var(--motion-fast,140ms)] ease-[var(--ease-standard)]',
      secondary:
        'bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:-translate-y-px active:translate-y-px focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 transition-all duration-[var(--motion-fast,140ms)]',
      outline:
        'bg-transparent hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] active:translate-y-px focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 transition-all duration-[var(--motion-fast,140ms)]',
      ghost:
        'bg-transparent hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent active:translate-y-px focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-all duration-[var(--motion-fast,140ms)]',
      destructive:
        'bg-[var(--status-danger)] hover:opacity-90 text-white border border-transparent shadow-xs hover:-translate-y-px active:translate-y-px focus-visible:ring-2 focus-visible:ring-[var(--status-danger)] focus-visible:ring-offset-2 transition-all duration-[var(--motion-fast,140ms)]',
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        aria-disabled={disabled || isLoading}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium select-none cursor-pointer',
          'focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:transform-none',
          sizeStyles[size],
          variantStyles[effectiveVariant],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            {loadingText ? <span>{loadingText}</span> : size !== 'icon' && children}
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
