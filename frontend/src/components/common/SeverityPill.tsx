import React from 'react';
import { cn } from '../../lib/utils';
import { 
  OctagonAlert, 
  TriangleAlert, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Zap, 
  ShieldAlert, 
  Bug, 
  Layers, 
  Eye, 
  Accessibility 
} from 'lucide-react';

export type FindingSeverity = 'blocker' | 'high' | 'medium' | 'low' | 'resolved';
export type FindingCategory = 'ux' | 'performance' | 'security' | 'bug' | 'architecture' | 'accessibility';

interface SeverityPillProps {
  severity?: FindingSeverity;
  category?: FindingCategory;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const SeverityPill: React.FC<SeverityPillProps> = ({
  severity,
  category,
  label,
  size = 'md',
  className,
}) => {
  if (severity) {
    const config = {
      blocker: {
        text: label || 'Blocker',
        icon: OctagonAlert,
        shape: 'rounded-md border-2 border-rose-600/80 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-500/80',
        ariaLabel: 'Severity: Blocker - Critical issue preventing progress',
      },
      high: {
        text: label || 'High Priority',
        icon: TriangleAlert,
        shape: 'rounded-md border border-orange-500/70 bg-orange-50 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-500/60',
        ariaLabel: 'Severity: High priority issue',
      },
      medium: {
        text: label || 'Medium Priority',
        icon: AlertCircle,
        shape: 'rounded-sm border border-amber-500/60 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-600/50',
        ariaLabel: 'Severity: Medium priority observation',
      },
      low: {
        text: label || 'Low Priority',
        icon: Info,
        shape: 'rounded-full border border-sky-400/50 bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-700/60',
        ariaLabel: 'Severity: Low priority suggestion',
      },
      resolved: {
        text: label || 'Addressed',
        icon: CheckCircle2,
        shape: 'rounded-full border border-emerald-500/50 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/60',
        ariaLabel: 'Status: Addressed and verified',
      },
    }[severity];

    const IconComponent = config.icon;
    const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5 font-medium';
    const iconSize = size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0';

    return (
      <span
        role="status"
        aria-label={config.ariaLabel}
        className={cn(
          'inline-flex items-center tracking-tight select-none transition-colors shadow-2xs font-mono font-medium',
          sizeClasses,
          config.shape,
          className
        )}
      >
        <IconComponent className={iconSize} aria-hidden="true" />
        <span>{config.text}</span>
      </span>
    );
  }

  if (category) {
    const catConfig = {
      ux: {
        text: label || 'UX & Usability',
        icon: Eye,
        style: 'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700/60 dark:bg-violet-950/40 dark:text-violet-300',
      },
      performance: {
        text: label || 'Performance',
        icon: Zap,
        style: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300',
      },
      security: {
        text: label || 'Security & Auth',
        icon: ShieldAlert,
        style: 'border-red-300 bg-red-50 text-red-800 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300',
      },
      bug: {
        text: label || 'Correctness Bug',
        icon: Bug,
        style: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700/60 dark:bg-rose-950/40 dark:text-rose-300',
      },
      architecture: {
        text: label || 'Architecture',
        icon: Layers,
        style: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700/60 dark:bg-blue-950/40 dark:text-blue-300',
      },
      accessibility: {
        text: label || 'Accessibility (A11y)',
        icon: Accessibility,
        style: 'border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-700/60 dark:bg-teal-950/40 dark:text-teal-300',
      },
    }[category];

    const Icon = catConfig.icon;
    const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';
    const iconSize = size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0';

    return (
      <span
        className={cn(
          'inline-flex items-center rounded-sm border font-medium tracking-tight select-none transition-colors shadow-2xs',
          sizeClasses,
          catConfig.style,
          className
        )}
      >
        <Icon className={iconSize} aria-hidden="true" />
        <span>{catConfig.text}</span>
      </span>
    );
  }

  return null;
};

