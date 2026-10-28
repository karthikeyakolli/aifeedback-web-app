import React, { useState } from 'react';
import { UserX, Send, CornerDownRight } from 'lucide-react';
import { Button } from '../common/Button';

interface CommentComposerProps {
  postId?: string;
  parentCommentId?: string;
  replyingToAuthor?: string;
  onSubmit: (content: string, isAnonymous: boolean, parentCommentId?: string) => Promise<void>;
  onCancelReply?: () => void;
  placeholder?: string;
}

export const CommentComposer: React.FC<CommentComposerProps> = ({
  parentCommentId,
  replyingToAuthor,
  onSubmit,
  onCancelReply,
  placeholder = 'Add a constructive review, critique, or suggestion...',
}) => {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), isAnonymous, parentCommentId);
      setContent('');
      if (onCancelReply) onCancelReply();
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101524] p-3.5 transition-all shadow-xs ${
        parentCommentId ? 'ml-4 sm:ml-8 border-l-2 border-l-blue-500' : ''
      }`}
    >
      {replyingToAuthor && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1">
            <CornerDownRight className="w-3.5 h-3.5 text-blue-500" />
            Replying to <strong className="text-slate-700 dark:text-slate-300">{replyingToAuthor}</strong>
          </span>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="text-xs text-rose-500 hover:underline cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      <textarea
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent resize-y text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none leading-relaxed"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80">
        {/* Anonymous toggle */}
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
          />
          <span className="flex items-center gap-1 font-medium">
            <UserX className="w-3.5 h-3.5 text-slate-400" />
            Comment Anonymously
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            (Shields your public identity)
          </span>
        </label>

        {/* Submit button */}
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            disabled={!content.trim()}
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            {parentCommentId ? 'Post Reply' : 'Submit Review'}
          </Button>
        </div>
      </div>
    </form>
  );
};
