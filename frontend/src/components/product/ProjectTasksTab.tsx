import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Coins,
  Gauge,
  Save,
} from 'lucide-react';
import { api } from '../../services/api';
import type {
  Project,
  ImprovementTask,
  ProjectAIConfig,
  ProjectAIUsageSummary,
} from '../../types';
import { Button } from '../common/Button';

interface ProjectTasksTabProps {
  project: Project;
}

export const ProjectTasksTab: React.FC<ProjectTasksTabProps> = ({ project }) => {
  const [tasks, setTasks] = useState<ImprovementTask[]>([]);
  const [aiUsage, setAiUsage] = useState<ProjectAIUsageSummary | null>(null);
  const [aiConfig, setAiConfig] = useState<ProjectAIConfig>({
    primaryProvider: 'gemini',
    fallbackProvider: 'openrouter',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [fetchedTasks, fetchedUsage, fetchedConfig] = await Promise.all([
        api.listImprovementTasks(project.id),
        api.getProjectAIUsage(project.id),
        api.getProjectAIConfig(project.id),
      ]);
      setTasks(fetchedTasks);
      setAiUsage(fetchedUsage);
      if (fetchedConfig && fetchedConfig['review']) {
        setAiConfig(fetchedConfig['review']);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load improvement tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [project.id]);

  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    try {
      await api.updateImprovementTaskStatus(project.id, taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update task status.');
    }
  };

  const handleVerifyTask = async (taskId: string) => {
    setVerifyingTaskId(taskId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await api.verifyImprovementTask(project.id, taskId);
      setSuccessMessage(`AI Verification ${result.verificationStatus}: ${result.feedback}`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification check failed.');
    } finally {
      setVerifyingTaskId(null);
    }
  };

  const handleSaveAIConfig = async () => {
    setIsSavingConfig(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await api.setProjectAIConfig(project.id, {
        taskType: 'review',
        primaryProvider: aiConfig.primaryProvider,
        fallbackProvider: aiConfig.fallbackProvider || 'openrouter',
        modelOverride: aiConfig.modelOverride || undefined,
      });
      setSuccessMessage('AI Provider preferences saved.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save AI configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. AI Orchestration & Usage Ledger Card */}
      <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[var(--accent)]" />
              <span>AI Provider Orchestration & Usage Ledger</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Select primary and fallback AI providers (Gemini, OpenRouter free tier, NVIDIA NIM, Groq). Token usage and estimated cost are tracked persistently.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadData} className="text-xs gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* Real-time Usage Metrics */}
        {aiUsage && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Invocations</span>
              </div>
              <div className="text-lg font-bold font-mono text-[var(--text-primary)] mt-1">
                {aiUsage.totalCalls}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                <Gauge className="w-3.5 h-3.5 text-blue-500" />
                <span>Tokens Processed</span>
              </div>
              <div className="text-lg font-bold font-mono text-[var(--text-primary)] mt-1">
                {aiUsage.totalTokens.toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                <Coins className="w-3.5 h-3.5 text-emerald-500" />
                <span>Total Cost</span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ${aiUsage.totalCostUsd.toFixed(4)}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                <span>Avg Latency</span>
              </div>
              <div className="text-lg font-bold font-mono text-[var(--text-primary)] mt-1">
                {aiUsage.averageLatencyMs} ms
              </div>
            </div>
          </div>
        )}

        {/* AI Provider Config Form */}
        <div className="pt-2 border-t border-[var(--border-default)] grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Primary Provider</label>
            <select
              value={aiConfig.primaryProvider}
              onChange={(e) => setAiConfig({ ...aiConfig, primaryProvider: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-hover)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="gemini">Google Gemini (Direct SDK)</option>
              <option value="openrouter">OpenRouter (Free Tier)</option>
              <option value="nvidia">NVIDIA NIM / API Catalog</option>
              <option value="groq">Groq (Llama 3 High-Speed)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Fallback Provider</label>
            <select
              value={aiConfig.fallbackProvider || 'openrouter'}
              onChange={(e) => setAiConfig({ ...aiConfig, fallbackProvider: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-hover)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="openrouter">OpenRouter (Free Tier)</option>
              <option value="nvidia">NVIDIA NIM</option>
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq</option>
              <option value="deterministic">Deterministic Offline Fallback</option>
            </select>
          </div>

          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveAIConfig}
              disabled={isSavingConfig}
              className="w-full text-xs font-semibold gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingConfig ? 'Saving...' : 'Save AI Config'}</span>
            </Button>
          </div>
        </div>

        {/* Success/Error Alerts */}
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

      {/* 2. Improvement Tasks & Verification List */}
      <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Improvement Tasks & Verification ({tasks.length})
            </h3>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)] animate-pulse">
            Loading improvement tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-[var(--border-default)] rounded-xl space-y-2">
            <CheckSquare className="w-6 h-6 mx-auto text-[var(--text-muted)] opacity-60" />
            <p className="text-xs font-semibold text-[var(--text-secondary)]">No active tasks created yet</p>
            <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
              Run an AI Review and click "Accept Finding" on any finding to automatically generate an improvement task here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-2">
                    <span>{task.title}</span>
                    {task.verificationStatus === 'passed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3" /> AI Verified
                      </span>
                    )}
                  </div>

                  {/* Status Picker */}
                  <div className="flex items-center gap-2">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                      className="px-2 py-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface)] text-xs text-[var(--text-secondary)] focus:outline-none"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleVerifyTask(task.id)}
                      disabled={verifyingTaskId === task.id}
                      className="text-xs font-semibold gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{verifyingTaskId === task.id ? 'Verifying...' : 'Verify with AI'}</span>
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {task.description}
                </p>

                {task.verificationFeedback && (
                  <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300">
                    <span className="font-semibold">AI Evidence Verification: </span>
                    {task.verificationFeedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
