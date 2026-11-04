import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  GitBranch,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  Layers,
  Sparkles,
  FileCode,
  Archive,
  BookOpen,
} from 'lucide-react';
import { api } from '../../services/api';
import type { Project, ProjectSource, RetrievedKnowledgeEvidence } from '../../types';
import { Button } from '../common/Button';
import { cn } from '../../lib/utils';

interface ProjectSourcesTabProps {
  project: Project;
}

export const ProjectSourcesTab: React.FC<ProjectSourcesTabProps> = ({ project }) => {
  const [sources, setSources] = useState<ProjectSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isLinkingRepo, setIsLinkingRepo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Repository input
  const [repoUrl, setRepoUrl] = useState(project.repositoryUrl || '');

  // RAG Search test
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RetrievedKnowledgeEvidence[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadSources = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.listProjectSources(project.id);
      setSources(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load project sources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, [project.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const uploaded = await api.uploadProjectSource(project.id, files[0]);
      setSuccessMessage(`Successfully ingested and indexed ${uploaded.length} source file(s) into Project Knowledge Base.`);
      await loadSources();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload source file.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleLinkRepo = async () => {
    if (!repoUrl.trim()) return;
    setIsLinkingRepo(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const linked = await api.linkProjectRepository(project.id, repoUrl.trim());
      setSuccessMessage(`Successfully connected repository and ingested ${linked.length} architecture files into RAG.`);
      await loadSources();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to link repository.');
    } finally {
      setIsLinkingRepo(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!window.confirm('Are you sure you want to remove this source document from project knowledge?')) return;
    try {
      await api.deleteProjectSource(project.id, sourceId);
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      setSuccessMessage('Source successfully removed from index.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove source.');
    }
  };

  const handleRunRAGSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await api.queryProjectRAG(project.id, searchQuery.trim(), 5);
      setSearchResults(results);
    } catch (err: any) {
      setErrorMessage('RAG search retrieval failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const getSourceIcon = (sourceType: string, filename: string) => {
    if (sourceType === 'archive' || filename.endsWith('.zip') || filename.endsWith('.tar')) {
      return <Archive className="w-4 h-4 text-amber-500" />;
    }
    if (sourceType === 'repository' || filename.includes('github') || filename.includes('gitlab')) {
      return <GitBranch className="w-4 h-4 text-purple-500" />;
    }
    if (sourceType === 'code' || filename.endsWith('.ts') || filename.endsWith('.py') || filename.endsWith('.js')) {
      return <FileCode className="w-4 h-4 text-emerald-500" />;
    }
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Overview & Ingestion Controls */}
      <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-6">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--accent)]" />
            <span>Project Source Ingestion & Knowledge Base</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Ingest technical documentation, source code, ZIP archives, and Git repositories. Content is parsed, safely chunked, and embedded into your private Project Knowledge Base for evidence-grounded AI intelligence.
          </p>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Grid: File Upload + Git Integration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File & ZIP Upload Card */}
          <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)] space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-[var(--accent)]" />
              <h4 className="text-xs font-bold text-[var(--text-primary)]">Upload Files or ZIP Archive</h4>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Upload source archives (.zip), PDF architectural specs, markdown RFCs, or code files up to 25 MB.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Ingesting...' : 'Select File or ZIP'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  accept=".zip,.tar,.gz,.pdf,.md,.txt,.py,.ts,.tsx,.js,.json,.sql"
                />
              </label>
              {isUploading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />}
            </div>
          </div>

          {/* Git Repository Integration Card */}
          <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)] space-y-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-500" />
              <h4 className="text-xs font-bold text-[var(--text-primary)]">Connect Git Repository</h4>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Connect a public GitHub or GitLab repository to index repository architecture, README, and specs.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLinkRepo}
                disabled={isLinkingRepo || !repoUrl.trim()}
                className="text-xs font-semibold shrink-0"
              >
                {isLinkingRepo ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Ingested Sources Table */}
      <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Active Project Sources ({sources.length})
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={loadSources} disabled={isLoading} className="text-xs gap-1">
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)] animate-pulse">
            Loading project knowledge sources...
          </div>
        ) : sources.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-[var(--border-default)] rounded-xl space-y-2">
            <BookOpen className="w-6 h-6 mx-auto text-[var(--text-muted)] opacity-60" />
            <p className="text-xs font-semibold text-[var(--text-secondary)]">No source documents ingested yet</p>
            <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
              Upload architectural documentation, specs, or connect a repository above to enrich AI feedback accuracy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
                  <th className="py-2.5 px-3 font-semibold">Source Name</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">File Size</th>
                  <th className="py-2.5 px-3 font-semibold">Ingested At</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="py-2.5 px-3 font-medium text-[var(--text-primary)] flex items-center gap-2">
                      {getSourceIcon(s.sourceType, s.originalFilename || s.name)}
                      <span className="truncate max-w-xs">{s.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)] capitalize">
                      {s.sourceType}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)]">
                      {s.fileSize > 0 ? `${(s.fileSize / 1024).toFixed(1)} KB` : 'Metadata'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)]">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteSource(s.id)}
                        className="text-rose-500 hover:text-rose-600 p-1 rounded hover:bg-rose-500/10 transition-colors"
                        title="Delete source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RAG Knowledge Retrieval Inspector */}
      <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Hybrid RAG Evidence Inspector</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Test how semantic embeddings and BM25 keywords retrieve verified evidence quotes across your private Project Knowledge Base and curated Reference Knowledge Base.
          </p>
        </div>

        <form onSubmit={handleRunRAGSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search concepts e.g. 'state loss during disconnects' or 'JWT authorization'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" disabled={isSearching || !searchQuery.trim()} className="text-xs">
            {isSearching ? 'Searching...' : 'Retrieve Evidence'}
          </Button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-[var(--text-secondary)]">
              Retrieved Evidence Chunks ({searchResults.length})
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {searchResults.map((r) => (
                <div
                  key={r.chunkId}
                  className="p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)] space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">{r.sourceName}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase',
                          r.knowledgeBase === 'project'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        )}
                      >
                        {r.knowledgeBase} KB
                      </span>
                      {r.pageNumber && (
                        <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-muted)] font-mono text-[10px]">
                          Page {r.pageNumber}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {r.relevancePercentage}% Match
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
                    "{r.cleanQuote}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
