import React, { useState, useEffect } from 'react';
import {
  UserX,
  Send,
  CornerDownRight,
  AlertCircle,
  Bold,
  Italic,
  List,
  Code,
  Quote,
  Eye,
  Edit3,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { MarkdownRenderer } from '../insights/MarkdownRenderer';

interface CommentComposerProps {
  postId?: string;
  parentCommentId?: string;
  replyingToAuthor?: string;
  onSubmit: (content: string, isAnonymous: boolean, parentCommentId?: string) => Promise<void>;
  onCancelReply?: () => void;
  placeholder?: string;
}

export const CommentComposer: React.FC<CommentComposerProps> = ({
  postId = 'default',
  parentCommentId,
  replyingToAuthor,
  onSubmit,
  onCancelReply,
  placeholder = 'Share a constructive review, critique, or question (Ctrl+Enter to submit)...',
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const draftKey = `pri_draft_comment_${postId}_${parentCommentId || 'root'}`;

  // Restore unsent draft from localStorage
  const [content, setContent] = useState<string>(() => {
    return localStorage.getItem(draftKey) || '';
  });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  // Auto-save draft on input
  useEffect(() => {
    if (content.trim()) {
      localStorage.setItem(draftKey, content);
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [content, draftKey]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (content.trim().length < 3) {
      setSubmitError('Comment must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(content.trim(), isAnonymous, parentCommentId);
      // Clean up draft upon confirmed success
      localStorage.removeItem(draftKey);
      setContent('');
      setMode('write');
      if (onCancelReply) onCancelReply();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit comment. Your draft was preserved.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for formatting shortcuts
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById(`comment_textarea_${draftKey}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const replacement = selected
      ? `${prefix}${selected}${suffix}`
      : `${prefix}text${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 4)
      );
    }, 10);
  };

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-all neomorph-card ${
        parentCommentId ? 'ml-2 sm:ml-6 border-l-4 border-l-indigo-600' : ''
      }`}
    >
      {replyingToAuthor && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2.5 pb-2 border-b border-[var(--border-subtle)]">
          <span className="flex items-center gap-1.5 font-medium">
            <CornerDownRight className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              Replying to <strong className="text-[var(--text-primary)]">@{replyingToAuthor}</strong>
            </span>
          </span>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="text-xs text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Write / Preview Tab Switcher & Formatting Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-subtle)]/70 text-xs">
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              mode === 'write'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              mode === 'preview'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
        </div>

        {/* Formatting Actions Toolbar (Visible in Write Mode) */}
        {mode === 'write' && (
          <div className="flex items-center gap-1 text-[var(--text-muted)]">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Bold (**text**)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Italic (*text*)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('- ')}
              className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Bullet list (- )"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('`', '`')}
              className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Inline Code (`code`)"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('> ')}
              className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Quote (> )"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {submitError && (
        <div
          role="alert"
          className="mb-2.5 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {mode === 'write' ? (
        <textarea
          id={`comment_textarea_${draftKey}`}
          rows={3}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (submitError) setSubmitError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent resize-y text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none leading-relaxed min-h-[72px]"
        />
      ) : (
        <div className="min-h-[72px] p-2.5 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)] text-xs">
          {content.trim() ? (
            <MarkdownRenderer content={content} />
          ) : (
            <span className="text-[var(--text-muted)] italic">
              Nothing to preview. Type feedback in the Write tab.
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-[var(--border-subtle)]">
        {/* Anonymous toggle & Keyboard hint */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-[var(--border-subtle)] text-indigo-600 focus:ring-indigo-500"
            />
            <span className="flex items-center gap-1 font-semibold text-[var(--text-primary)]">
              <UserX className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              Comment Anonymously
            </span>
          </label>

          <span className="text-[11px] text-[var(--text-muted)] hidden md:inline">
            Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] font-mono text-[10px]">
              Ctrl+Enter
            </kbd>
          </span>
        </div>

        {/* Character feedback & Submit button */}
        <div className="flex items-center gap-3">
          {content.length > 0 && (
            <span
              className={`text-[11px] ${
                content.trim().length >= 3
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {content.length} chars
            </span>
          )}

          <Button
            type="submit"
            size="sm"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!content.trim()}
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            {parentCommentId ? 'Post Reply' : 'Post Comment'}
          </Button>
        </div>
      </div>
    </form>
  );
};
