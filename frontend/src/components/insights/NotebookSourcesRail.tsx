import React, { useState, useRef } from 'react';
import {
  BookOpen,
  FileText,
  FileCode,
  Search,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap,
  User,
  UploadCloud,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { Comment, DocumentSourceInfo } from '../../types';
import { formatTimeAgo } from '../../lib/utils';
import { api } from '../../services/api';

interface NotebookSourcesRailProps {
  postId?: string;
  documents: DocumentSourceInfo[];
  comments: Comment[];
  selectedDocIds: string[];
  onToggleDocId: (docId: string) => void;
  onSelectAllDocs: (selectAll: boolean) => void;
  includeCommunity: boolean;
  onToggleIncludeCommunity: () => void;
  onInspectSource: (source: { type: 'comment' | 'document'; data: any }) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hasNewActivity?: boolean;
  newActivityText?: string;
  onOpenUploadModal?: () => void;
  onDocumentUploaded?: () => void;
}

export const NotebookSourcesRail: React.FC<NotebookSourcesRailProps> = ({
  postId,
  documents,
  comments,
  selectedDocIds,
  onToggleDocId,
  onSelectAllDocs,
  includeCommunity,
  onToggleIncludeCommunity,
  onInspectSource,
  isCollapsed,
  onToggleCollapse,
  hasNewActivity,
  newActivityText,
  onOpenUploadModal,
  onDocumentUploaded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'docs' | 'comments'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handler
  const handleUploadFile = async (file: File) => {
    if (!postId) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      await api.uploadPostDocument(postId, file);
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter comments
  const filteredComments = comments.filter(
    (c) =>
      c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.author.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.author.displayName && c.author.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalSourcesCount = documents.length + (comments.length > 0 ? 1 : 0);
  const activeSourcesCount =
    selectedDocIds.length + (includeCommunity && comments.length > 0 ? 1 : 0);

  // Collapsed Minimal Strip
  if (isCollapsed) {
    return (
      <div className="w-12 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface-subtle)]/70 flex flex-col items-center py-4 space-y-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title="Expand Sources Rail"
        >
          <ChevronRight className="w-4 h-4 text-indigo-500" />
        </button>

        <div className="flex flex-col items-center gap-1">
          <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[10px] font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {activeSourcesCount}
          </span>
        </div>

        {hasNewActivity && (
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="New activity" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`w-80 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface-subtle)]/40 flex flex-col h-full overflow-hidden transition-all duration-200 ${
        isDragging ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUploadFile(e.target.files[0]);
          }
        }}
        accept=".pdf,.md,.txt"
        className="hidden"
      />

      {/* Sources Header */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] space-y-2.5 bg-[var(--surface)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Sources
            </h3>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">
              {activeSourcesCount}/{totalSourcesCount}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (onOpenUploadModal) {
                  onOpenUploadModal();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-indigo-600 transition-colors cursor-pointer"
              title="Upload New Spec/Document (.pdf, .md, .txt)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Collapse Sources Rail"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Fresh Activity Alert */}
        {hasNewActivity && newActivityText && (
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{newActivityText}</span>
          </div>
        )}

        {/* Drag-and-Drop Ingestion Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 rounded-xl border border-dashed transition-all text-center cursor-pointer ${
            isDragging
              ? 'border-indigo-600 bg-indigo-500/10'
              : 'border-[var(--border-subtle)] hover:border-indigo-500/50 bg-[var(--surface-subtle)]'
          }`}
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium py-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Indexing document into BM25...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-medium text-[11px]">
                Drop or click to add PDF, MD, or TXT
              </span>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{uploadError}</span>
          </div>
        )}

        {/* Filter Type Pills */}
        <div className="flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            All ({totalSourcesCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('docs')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
              filterType === 'docs'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Docs ({documents.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('comments')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
              filterType === 'comments'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Feedback ({comments.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sources..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
        </div>

        {/* Global Select All Toggle */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-0.5">
          <button
            type="button"
            onClick={() => onSelectAllDocs(selectedDocIds.length < documents.length)}
            className="flex items-center gap-1.5 hover:text-[var(--text-primary)] cursor-pointer"
          >
            {selectedDocIds.length === documents.length ? (
              <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span>Select All Documents</span>
          </button>

          <span className="font-mono text-[10px]">
            {activeSourcesCount} active in context
          </span>
        </div>
      </div>

      {/* Sources Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Category 1: Project Documentation & Whitepapers */}
        {(filterType === 'all' || filterType === 'docs') && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Internal Documents ({filteredDocs.length})
              </span>
            </div>

            {filteredDocs.length === 0 ? (
              <p className="text-[11px] text-[var(--text-muted)] italic px-2 py-1">
                No matching documentation. Drop a file above to add.
              </p>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    className={`group flex items-start gap-2 p-2 rounded-xl border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--surface)] border-[var(--border-subtle)] shadow-2xs hover:border-indigo-500/50'
                        : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-[var(--surface)]/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleDocId(doc.id);
                      }}
                      className="mt-0.5 text-indigo-500 hover:text-indigo-600 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      )}
                    </button>

                    <div
                      className="flex-1 min-w-0"
                      onClick={() => onInspectSource({ type: 'document', data: doc })}
                    >
                      <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)] truncate">
                        {doc.fileType === 'pdf' ? (
                          <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : (
                          <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )}
                        <span className="truncate text-xs font-semibold">{doc.filename}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-muted)]">
                        <span className="uppercase font-mono font-semibold">{doc.fileType}</span>
                        <span>•</span>
                        <span>{Math.round(doc.fileSize / 1024)} KB</span>
                        <span>•</span>
                        <span>{doc.characterCount.toLocaleString()} chars</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Category 2: Community Feedback & Discussions */}
        {(filterType === 'all' || filterType === 'comments') && (
          <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Community Feedback ({filteredComments.length})
              </span>
              <button
                type="button"
                onClick={onToggleIncludeCommunity}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer"
              >
                {includeCommunity ? 'Disable All' : 'Enable All'}
              </button>
            </div>

            {/* Global Community Feedback Master Card */}
            <div
              className={`flex items-start gap-2 p-2.5 rounded-xl border transition-all text-xs cursor-pointer ${
                includeCommunity
                  ? 'bg-[var(--surface)] border-[var(--border-subtle)] shadow-2xs'
                  : 'bg-transparent border-transparent opacity-60'
              }`}
              onClick={onToggleIncludeCommunity}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleIncludeCommunity();
                }}
                className="mt-0.5 text-indigo-500 cursor-pointer"
              >
                {includeCommunity ? (
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[var(--text-primary)]">
                    Community Feedback Pool
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {comments.length} reviews
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Public customer opinions, bug reports, and workflow friction.
                </p>
              </div>
            </div>

            {/* Individual Comment Cards */}
            <div className="space-y-1 pl-2 border-l border-[var(--border-subtle)]">
              {filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  onClick={() => onInspectSource({ type: 'comment', data: comment })}
                  className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors cursor-pointer text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                      <User className="w-3 h-3 text-emerald-500" />
                      <span>{comment.author.displayName || comment.author.username}</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    "{comment.content}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--surface)] text-[11px] text-[var(--text-muted)] flex items-center justify-between">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-indigo-500" />
          <span>Notebook Context</span>
        </span>
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
          BM25 Indexed
        </span>
      </div>
    </div>
  );
};
