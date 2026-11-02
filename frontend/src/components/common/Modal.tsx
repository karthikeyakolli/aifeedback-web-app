import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  showCloseButton?: boolean;
  className?: string;
}

/**
 * Accessible Dialog / Modal Component (Spec 08_BUTTON_AND_CONTROL_CATALOG.md, 11_RESPONSIVE_ACCESSIBILITY_AND_THEMES.md)
 * Built on Radix UI Dialog with focus trap, Escape key dismiss, backdrop scrim, and portal rendering.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  showCloseButton = true,
  className,
}) => {
  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-xs',
            'transition-opacity duration-[var(--motion-standard,200ms)] ease-[var(--ease-enter)]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <DialogPrimitive.Content
            className={cn(
              'relative w-full rounded-[var(--radius-xl,18px)] border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] shadow-2xl p-6 sm:p-8',
              'transition-all duration-[var(--motion-standard,200ms)] ease-[var(--ease-enter)]',
              'focus:outline-none',
              maxWidthStyles[maxWidth],
              className
            )}
          >
            {showCloseButton && (
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="Close dialog"
                  className="absolute right-4 top-4 p-2 rounded-[var(--radius-sm,8px)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </DialogPrimitive.Close>
            )}

            {title && (
              <DialogPrimitive.Title className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)] mb-1.5">
                {title}
              </DialogPrimitive.Title>
            )}

            {description && (
              <DialogPrimitive.Description className="text-xs sm:text-sm text-[var(--text-secondary)] mb-5">
                {description}
              </DialogPrimitive.Description>
            )}

            <div>{children}</div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
