import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Clock,
  Layers,
  Table as TableIcon,
  Network,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import type { Project, CompletenessMapData, CompletenessNode } from '../../types';
import { Button } from '../common/Button';
import { cn } from '../../lib/utils';

interface ProjectCompletenessTabProps {
  project: Project;
}

export const ProjectCompletenessTab: React.FC<ProjectCompletenessTabProps> = ({ project }) => {
  const [mapData, setMapData] = useState<CompletenessMapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active projection view
  const [activeView, setActiveView] = useState<'table' | 'hierarchy' | 'graph'>('table');
  const [filterGapOnly, setFilterGapOnly] = useState(false);

  // Author Decision Dialog
  const [selectedNode, setSelectedNode] = useState<CompletenessNode | null>(null);
  const [decisionRationale, setDecisionRationale] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  const loadCompletenessMap = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getCompletenessMap(project.id);
      setMapData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load completeness map.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompletenessMap();
  }, [project.id]);

  const handleRecordDecision = async (decision: 'approved' | 'dismissed' | 'deferred') => {
    if (!selectedNode) return;
    setIsSubmittingDecision(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await api.recordCompletenessDecision(project.id, selectedNode.id, decision, decisionRationale);
      setSuccessMessage(`Decision '${decision}' recorded for element '${selectedNode.title}'.`);
      setSelectedNode(null);
      setDecisionRationale('');
      await loadCompletenessMap();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record author decision.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
      case 'evidenced_present':
      case 'verified_complete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> {status === 'verified_complete' ? 'Verified Complete' : status === 'evidenced_present' ? 'Evidenced Present' : 'Complete'}
          </span>
        );
      case 'partially_evidenced':
      case 'specified_not_verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-[10px] font-bold">
            <Clock className="w-3 h-3" /> {status === 'partially_evidenced' ? 'Partially Evidenced' : 'Specified Unverified'}
          </span>
        );
      case 'incomplete':
      case 'not_verified':
      case 'awaiting_author_decision':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">
            <Clock className="w-3 h-3" /> {status === 'awaiting_author_decision' ? 'Awaiting Decision' : status === 'not_verified' ? 'Not Verified' : 'Incomplete'}
          </span>
        );
      case 'missing':
      case 'not_provided':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold">
            <XCircle className="w-3 h-3" /> {status === 'not_provided' ? 'Not Provided' : 'Missing Spec'}
          </span>
        );
      case 'contradictory':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold">
            <AlertTriangle className="w-3 h-3" /> Contradiction
          </span>
        );
      case 'unclear':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-[10px] font-bold">
            <AlertCircle className="w-3 h-3" /> Unclear Spec
          </span>
        );
      case 'not_applicable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 font-mono text-[10px]">
            N/A
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 font-mono text-[10px]">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-[var(--text-muted)] animate-pulse">
        Building product completeness knowledge graph and analyzing architectural gaps...
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-center space-y-3">
        <AlertCircle className="w-6 h-6 mx-auto text-amber-500" />
        <p className="text-xs text-[var(--text-secondary)]">Unable to load completeness map data.</p>
        <Button variant="secondary" size="sm" onClick={loadCompletenessMap}>
          Retry
        </Button>
      </div>
    );
  }

  const { summary, table, hierarchy, graph } = mapData;

  const filteredTable = filterGapOnly ? table.filter((t) => t.hasGap) : table;

  return (
    <div className="space-y-6">
      {/* 1. Completeness Score and Summary Cards */}
      <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Network className="w-4 h-4 text-[var(--accent)]" />
              <span>Product Completeness & Knowledge Map</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Deterministic graph verification across goals, features, APIs, database entities, security policies, and tests.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-[var(--accent)]">
                {summary.completenessPercentage}%
              </div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                Completeness Score
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={loadCompletenessMap} className="text-xs gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Metric Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)]">
            <div className="text-[11px] font-semibold text-[var(--text-muted)]">Complete</div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {summary.completeCount}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)]">
            <div className="text-[11px] font-semibold text-[var(--text-muted)]">Incomplete</div>
            <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {summary.incompleteCount}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)]">
            <div className="text-[11px] font-semibold text-[var(--text-muted)]">Missing Gaps</div>
            <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              {summary.missingCount}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)]">
            <div className="text-[11px] font-semibold text-[var(--text-muted)]">Contradictions</div>
            <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
              {summary.contradictoryCount}
            </div>
          </div>
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
      </div>

      {/* 2. Projection Selector & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('table')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeView === 'table'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Gap Matrix Table</span>
          </button>
          <button
            onClick={() => setActiveView('hierarchy')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeView === 'hierarchy'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hierarchical Tree</span>
          </button>
          <button
            onClick={() => setActiveView('graph')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeView === 'graph'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Network Graph</span>
          </button>
        </div>

        {activeView === 'table' && (
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={filterGapOnly}
              onChange={(e) => setFilterGapOnly(e.target.checked)}
              className="rounded border-[var(--border-default)]"
            />
            <span>Show Only Gaps & Missing Items</span>
          </label>
        )}
      </div>

      {/* 3. Projection View Content */}
      {activeView === 'table' && (
        <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
                <th className="py-2.5 px-3 font-semibold">Element Title</th>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Confidence</th>
                <th className="py-2.5 px-3 font-semibold">Connections</th>
                <th className="py-2.5 px-3 font-semibold text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {filteredTable.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-[var(--text-primary)]">{item.title}</div>
                    <div className="text-[11px] text-[var(--text-muted)] line-clamp-1">{item.description}</div>
                  </td>
                  <td className="py-2.5 px-3 capitalize font-mono text-[11px] text-[var(--text-secondary)]">
                    {item.type.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3">{getStatusBadge(item.status)}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--text-muted)]">
                    {Math.round(item.confidenceScore * 100)}%
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--text-secondary)]">
                    {item.connectedRelations} edge(s)
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const fullNode = graph.nodes.find((n) => n.id === item.id);
                        if (fullNode) setSelectedNode(fullNode);
                      }}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Action
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeView === 'hierarchy' && (
        <div className="space-y-4">
          {hierarchy.map((tier) => (
            <div
              key={tier.tier}
              className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  {tier.tierLabel} ({tier.count})
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tier.items.map((node) => (
                  <div
                    key={node.id}
                    className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[var(--text-primary)]">{node.title}</span>
                      {getStatusBadge(node.status)}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">{node.description}</p>
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => setSelectedNode(node)}
                        className="text-[11px] text-[var(--accent)] font-semibold hover:underline"
                      >
                        Author Action
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeView === 'graph' && (
        <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[var(--text-primary)]">
              Interactive Relationship Topology ({graph.nodes.length} Nodes, {graph.edges.length} Edges)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {graph.nodes.map((node) => {
              const connectedEdges = graph.edges.filter(
                (e) => e.sourceNodeId === node.id || e.targetNodeId === node.id
              );
              return (
                <div
                  key={node.id}
                  className="p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)]">
                      {node.nodeType}
                    </span>
                    {getStatusBadge(node.status)}
                  </div>
                  <div className="font-semibold text-xs text-[var(--text-primary)]">{node.title}</div>
                  <div className="text-[11px] text-[var(--text-muted)] line-clamp-2">{node.description}</div>
                  <div className="pt-2 border-t border-[var(--border-default)] text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                    <span>{connectedEdges.length} connections</span>
                    <button
                      onClick={() => setSelectedNode(node)}
                      className="text-[var(--accent)] font-semibold hover:underline"
                    >
                      Review Node
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Author Decision Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-default)] shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Author Decision</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-[var(--text-primary)]">{selectedNode.title}</div>
              <p className="text-xs text-[var(--text-secondary)]">{selectedNode.description}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)]">
                Author Rationale (Optional Note)
              </label>
              <textarea
                rows={3}
                placeholder="Explain the architectural decision or implementation plan..."
                value={decisionRationale}
                onChange={(e) => setDecisionRationale(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRecordDecision('deferred')}
                disabled={isSubmittingDecision}
                className="text-xs text-amber-500"
              >
                Defer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRecordDecision('dismissed')}
                disabled={isSubmittingDecision}
                className="text-xs text-slate-500"
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleRecordDecision('approved')}
                disabled={isSubmittingDecision}
                className="text-xs font-bold"
              >
                {isSubmittingDecision ? 'Saving...' : 'Approve & Mark Complete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
