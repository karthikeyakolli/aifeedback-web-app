import React from 'react';
import { useSpace, SPACES, type AppSpace } from '../../context/SpaceContext';
import { Globe, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../common/Tooltip';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from '../common/Dropdown';

interface SpaceSwitcherProps {
  isCollapsed?: boolean;
  className?: string;
}

export const SpaceSwitcher: React.FC<SpaceSwitcherProps> = ({
  isCollapsed = false,
  className = '',
}) => {
  const { currentSpace, switchSpace } = useSpace();

  const getSpaceIcon = (space: AppSpace, sizeClass = 'w-4 h-4') => {
    switch (space) {
      case 'public':
        return <Globe className={cn(sizeClass, 'text-sky-500')} />;
      case 'personal':
        return <ShieldCheck className={cn(sizeClass, 'text-indigo-500')} />;
      case 'creator':
        return <Sparkles className={cn(sizeClass, 'text-amber-500')} />;
    }
  };

  if (isCollapsed) {
    return (
      <Dropdown>
        <Tooltip content={`Space: ${SPACES[currentSpace].label} (${SPACES[currentSpace].badge})`} side="right">
          <DropdownTrigger asChild>
            <button
              type="button"
              aria-label={`Current space: ${SPACES[currentSpace].label}. Click to switch spaces.`}
              className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center border border-[var(--border-default)] bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-all cursor-pointer shadow-2xs"
            >
              {getSpaceIcon(currentSpace, 'w-5 h-5')}
            </button>
          </DropdownTrigger>
        </Tooltip>

        <DropdownContent side="right" align="start" className="w-56 p-2">
          <DropdownLabel>Switch Application Space</DropdownLabel>
          <p className="px-2.5 pb-2 text-[11px] text-[var(--text-muted)] leading-tight">
            Switches view context only. Never alters content privacy.
          </p>
          <DropdownSeparator />
          {(['public', 'personal', 'creator'] as AppSpace[]).map((space) => {
            const info = SPACES[space];
            const isSelected = currentSpace === space;
            return (
              <DropdownItem
                key={space}
                onClick={() => switchSpace(space)}
                className={cn(
                  'flex items-center justify-between gap-2 my-0.5 rounded-lg p-2 cursor-pointer',
                  isSelected && 'bg-[var(--accent)]/10 font-bold text-[var(--accent)]'
                )}
              >
                <div className="flex items-center gap-2">
                  {getSpaceIcon(space)}
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold">{info.label}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{info.badge}</span>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                )}
              </DropdownItem>
            );
          })}
        </DropdownContent>
      </Dropdown>
    );
  }

  return (
    <div className={cn('p-2 bg-[var(--canvas)] rounded-xl border border-[var(--border-default)]', className)}>
      <div className="flex items-center justify-between px-1 mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Active Space
        </span>
        <span className="text-[10px] font-mono text-[var(--accent)] font-medium">
          {SPACES[currentSpace].badge}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border-default)]">
        {(['public', 'personal', 'creator'] as AppSpace[]).map((space) => {
          const info = SPACES[space];
          const isSelected = currentSpace === space;

          return (
            <Tooltip
              key={space}
              content={`${info.label} Space: ${info.shortDescription}`}
              side="bottom"
            >
              <button
                type="button"
                onClick={() => switchSpace(space)}
                aria-pressed={isSelected}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer',
                  isSelected
                    ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs border border-[var(--border-strong)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                )}
              >
                <div className="flex items-center gap-1">
                  {getSpaceIcon(space, 'w-3.5 h-3.5')}
                  <span className="text-[11px]">{info.label}</span>
                </div>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
