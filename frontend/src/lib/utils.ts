import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Sanitizes and neatly formats text for UI rendering.
 * Strips code fences, raw XML/HTML prompt tags, stray brackets, and leading bullets.
 */
export function formatCleanText(text: string | null | undefined, stripLeadingBullet = false): string {
  if (!text) return '';
  let s = String(text);

  // Remove code blocks
  s = s.replace(/```(?:json|markdown|text|xml)?/gi, '').replace(/```/g, '');

  // Remove XML/HTML tags
  s = s.replace(/<\/?[a-zA-Z0-9_-]+(?:\s+[^>]*)?>/g, '');

  // Remove inline citation brackets like [cite: 1] or [comment-1]
  s = s.replace(/\[(?:cite:?|comment:?|ref:?)?\s*([a-zA-Z0-9_-]{8,}|[0-9]+)\]/gi, '');

  // Strip duplicate leading bullets if requested
  if (stripLeadingBullet) {
    s = s.replace(/^(?:[\d]+[\.\)]|\*|\-|\u2022|\u25aa|\u25b8)\s*/, '');
  }

  // Normalize whitespace
  s = s.replace(/[ \t]+/g, ' ').trim();
  return s;
}

export function formatCategoryLabel(category?: string | null): string {
  if (!category) return 'General';
  const map: Record<string, string> = {
    'developer-tools': 'Developer Tools',
    'productivity': 'Productivity',
    'ai-ml': 'AI & ML',
    'design-ux': 'Design & UX',
    'saas-b2b': 'Business & SaaS',
    'mobile': 'Mobile Apps',
    'infrastructure': 'Infrastructure',
    'education': 'Education',
    'entertainment': 'Entertainment',
  };
  return map[category] || category.charAt(0).toUpperCase() + category.slice(1);
}
