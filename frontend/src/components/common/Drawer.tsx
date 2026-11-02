import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  side?: 'right' | 'bottom' | 'left';
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

/**
 * Accessible Drawer / Sheet Component (Spec 09_MOTION_HOVER_AND_INTERACTION.md, 11_RESPONSIVE_ACCESSIBILITY_AND_THEMES.md)
 * Built on Radix UI Dialog. Supports right-side panels (desktop inspector) and bottom sheets (mobile task flows).
 */
export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = 'right',
  size = 'md',
  showCloseButton = true,
  className,
}) => {
  const sideStyles = {
    right: 'inset-y-0 right-0 h-full border-l border-[var(--border-default)]',
    left: 'inset-y-0 left-0 h-full border-r border-[var(--border-default)]',
    bottom: 'inset-x-0 bottom-0 max-h-[90vh] rounded-t-[var(--radius-xl,18px)] border-t border-[var(--border-default)]',
  };

  const widthStyles = {
    sm: side === 'bottom' ? 'h-64' : 'w-full max-w-sm',
    md: side === 'bottom' ? 'h-96' : 'w-full max-w-md sm:max-w-md',
    lg: side === 'bottom' ? 'h-[75vh]' : 'w-full max-w-lg sm:max-w-xl',
    full: 'w-full h-full',
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-xs',
            'transition-opacity duration-[var(--motion-panel,240ms)] ease-[var(--ease-enter)]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 bg-[var(--surface)] text-[var(--text-primary)] shadow-2xl overflow-y-auto p-6 focus:outline-none',
            'transition-transform duration-[var(--motion-panel,240ms)] ease-[var(--ease-enter)]',
            sideStyles[side],
            widthStyles[size],
            className
          )}
        >
          {side === 'bottom' && (
            <div className="w-12 h-1.5 bg-[var(--border-strong)] rounded-full mx-auto -mt-2 mb-4" />
          )}

          <div className="flex items-start justify-between mb-4">
            <div>
              {title && (
                <DialogPrimitive.Title className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="text-xs text-[var(--text-secondary)] mt-1">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>

            {showCloseButton && (
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="Close drawer"
                  className="p-1.5 rounded-[var(--radius-sm,8px)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </DialogPrimitive.Close>
            )}
          </div>

          <div className="mt-2">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

