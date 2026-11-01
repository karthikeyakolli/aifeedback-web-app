import React, { useEffect } from 'react';
import { X, FileText, Calendar, HardDrive, Copy, Check, Hash } from 'lucide-react';
import type { PostDocument } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface DocumentPreviewModalProps {
  document: PostDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: doc,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !doc) return null;

  const handleCopy = () => {
    if (doc.contentText) {
      navigator.clipboard.writeText(doc.contentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Split content by genuine page delimiters if PDF
  const rawContent = doc.contentText || '';
  const hasPageMarkers = rawContent.includes('--- [Page ');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[var(--evidence-document)] border border-blue-200/80 dark:border-blue-900/60">
              <FileText className="w-5 h-5 shrink-0" />
            </div>
            <div className="min-w-0">
              <h2
                id="doc-preview-title"
                className="text-base font-bold text-[var(--text-primary)] truncate"
              >
                {doc.filename}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                <Badge variant="outline" size="sm" className="uppercase font-mono text-[10px]">
                  {doc.fileType}
                </Badge>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  {formatSize(doc.fileSize)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {doc.characterCount.toLocaleString()} chars
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {doc.contentText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-xs font-semibold cursor-pointer"
                title="Copy extracted text"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                  </>
                )}
              </Button>
            )}
            <button
              onClick={onClose}
              aria-label="Close document preview"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs text-[var(--text-primary)] leading-relaxed bg-[var(--bg-surface)]">
          {rawContent ? (
            hasPageMarkers ? (
              // Structured PDF with genuine page breaks
              <div className="space-y-6">
                {rawContent.split(/(?=--- \[Page \d+\] ---)/).map((chunk, idx) => {
                  const match = chunk.match(/^--- \[Page (\d+)\] ---\n?([\s\S]*)$/);
                  const pageNum = match ? match[1] : null;
                  const pageText = match ? match[2].trim() : chunk.trim();

                  return (
                    <div
                      key={idx}
                      className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-secondary)]/30"
                    >
                      {pageNum && (
                        <div className="px-4 py-1.5 bg-blue-50/70 dark:bg-blue-950/40 border-b border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-sans font-bold text-blue-700 dark:text-blue-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Page {pageNum}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-normal font-mono">
                            {pageText.length} characters
                          </span>
                        </div>
                      )}
                      <div className="p-4 whitespace-pre-wrap font-sans text-xs text-[var(--text-primary)]/90 leading-relaxed">
                        {pageText || <span className="text-[var(--text-muted)] italic">Empty page</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Markdown or Plain Text document view
              <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 whitespace-pre-wrap font-sans text-xs text-[var(--text-primary)]/90 leading-relaxed">
                {rawContent}
              </div>
            )
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)]">
              No extracted text available for this document.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Uploaded {new Date(doc.createdAt).toLocaleString()}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
};
