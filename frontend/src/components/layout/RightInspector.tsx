import React from 'react';
import { useSpace } from '../../context/SpaceContext';
import { X, PanelRightClose } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../common/Tooltip';

interface RightInspectorProps {
  className?: string;
}

export const RightInspector: React.FC<RightInspectorProps> = ({ className }) => {
  const { isInspectorOpen, closeInspector, inspectorTitle, inspectorContent } = useSpace();

  if (!inspectorContent) return null;

  return (
    <aside
      aria-label="Contextual Inspector Panel"
      aria-hidden={!isInspectorOpen}
      className={cn(
        'hidden lg:flex flex-col border-l border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] transition-all duration-240 ease-out select-none shrink-0 z-10 overflow-hidden',
        isInspectorOpen ? 'w-[320px] opacity-100' : 'w-0 opacity-0 border-l-0 pointer-events-none',
        className
      )}
    >
      {/* Panel Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-default)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <PanelRightClose className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] truncate">
            {inspectorTitle || 'Inspector'}
          </h2>
        </div>
        <Tooltip content="Close panel" side="left">
          <button
            type="button"
            onClick={closeInspector}
            aria-label="Close inspector panel"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      {/* Panel Content Surface */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {inspectorContent}
      </div>
    </aside>
  );
};

