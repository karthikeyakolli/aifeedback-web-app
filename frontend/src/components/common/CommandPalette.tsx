import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Compass,
  PlusCircle,
  Database,
  BarChart3,
  Moon,
  Sun,
  Monitor,
  ArrowRight,
  CornerDownLeft,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation' | 'AI Tools' | 'Preferences' | 'Search';
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global hotkey: Escape closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Command items collection
  const allCommands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      {
        id: 'nav-explore',
        title: 'Explore Products & Feedback',
        subtitle: 'Browse all community discussions and launches',
        category: 'Navigation',
        icon: <Compass className="w-4 h-4 text-indigo-500" />,
        action: () => {
          navigate('/explore');
          onClose();
        },
        keywords: ['feed', 'products', 'browse', 'discover', 'discussions'],
      },
      {
        id: 'nav-create',
        title: 'Launch / Post New Product',
        subtitle: 'Publish your product and start gathering evidence',
        category: 'Navigation',
        icon: <PlusCircle className="w-4 h-4 text-emerald-500" />,
        action: () => {
          if (!isAuthenticated) {
            openAuthModal();
          } else {
            navigate('/create');
          }
          onClose();
        },
        keywords: ['publish', 'new', 'create', 'launch', 'submit'],
      },
      {
        id: 'ai-lab',
        title: 'AI Testing Lab & Prompt Sandbox',
        subtitle: 'Run benchmark queries, inspect stages, and test grounding',
        category: 'AI Tools',
        icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
        action: () => {
          navigate('/ai-testing-lab');
          onClose();
        },
        keywords: ['sandbox', 'benchmark', 'testing', 'prompt', 'rag', 'bm25'],
      },
      {
        id: 'ai-synthetic',
        title: 'Synthetic Data Manager',
        subtitle: 'Generate and manage realistic personas and reviews',
        category: 'AI Tools',
        icon: <Database className="w-4 h-4 text-amber-500" />,
        action: () => {
          navigate('/synthetic-data');
          onClose();
        },
        keywords: ['seed', 'mock', 'synthetic', 'test data', 'dataset'],
      },
      {
        id: 'ai-matrix',
        title: 'Provider Benchmark Matrix',
        subtitle: 'Compare Gemini vs Groq latency, cost, and hallucination metrics',
        category: 'AI Tools',
        icon: <BarChart3 className="w-4 h-4 text-purple-500" />,
        action: () => {
          navigate('/benchmark-matrix');
          onClose();
        },
        keywords: ['gemini', 'groq', 'performance', 'latency', 'matrix', 'comparison'],
      },
      {
        id: 'theme-toggle',
        title: resolvedTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        subtitle: `Currently using ${resolvedTheme} mode`,
        category: 'Preferences',
        icon: resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
        action: () => {
          setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
          onClose();
        },
        keywords: ['theme', 'dark', 'light', 'mode', 'color', 'appearance'],
      },
      {
        id: 'theme-system',
        title: 'Use System Theme Preference',
        subtitle: 'Sync color scheme with operating system settings',
        category: 'Preferences',
        icon: <Monitor className="w-4 h-4 text-slate-400" />,
        action: () => {
          setTheme('system');
          onClose();
        },
        keywords: ['system', 'os', 'auto', 'theme'],
      },
    ];

    return items;
  }, [navigate, onClose, isAuthenticated, openAuthModal, resolvedTheme, setTheme]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;

    const matched = allCommands.filter((cmd) => {
      const inTitle = cmd.title.toLowerCase().includes(q);
      const inSubtitle = cmd.subtitle.toLowerCase().includes(q);
      const inKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(q));
      return inTitle || inSubtitle || inKeywords;
    });

    // If query has text, prepend direct product search
    const dynamicSearch: CommandItem = {
      id: 'dynamic-search',
      title: `Search products for "${query}"`,
      subtitle: 'Open community explore filtered by query keyword',
      category: 'Search',
      icon: <Search className="w-4 h-4 text-indigo-500" />,
      action: () => {
        navigate(`/explore?search=${encodeURIComponent(query)}`);
        onClose();
      },
    };

    return [dynamicSearch, ...matched];
  }, [allCommands, query, navigate, onClose]);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]/40">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, product name, or navigation target..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-[var(--border-subtle)]/30 max-h-96"
        >
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-1">
              <p className="font-semibold text-[var(--text-primary)]">No matching commands or products</p>
              <p>Try searching for "explore", "testing", "theme", or "launch".</p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'hover:bg-[var(--surface-subtle)] text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] shadow-2xs shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center gap-2">
                        <span>{cmd.title}</span>
                        <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-[var(--surface-subtle)] text-[var(--text-muted)] font-mono border border-[var(--border-subtle)]/60">
                          {cmd.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                        {cmd.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    {isSelected && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                        <span>Select</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Footer Hints */}
        <div className="px-4 py-2 bg-[var(--surface-subtle)] border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-subtle)] text-[10px] font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-subtle)] text-[10px] font-mono">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-subtle)] text-[10px] font-mono">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="text-[10px] font-mono">ResearchIntel Global Spotlight</span>
        </div>
      </div>
    </div>
  );
};
