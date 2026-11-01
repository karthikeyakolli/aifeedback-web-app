import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  EyeOff,
  Eye,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import type { ModerationReport } from '../types';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatTimeAgo } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const ModerationPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Thread lock management
  const [lockPostId, setLockPostId] = useState('');
  const [isLocking, setIsLocking] = useState(false);
  const [lockStatusMessage, setLockStatusMessage] = useState<string | null>(null);

  const isModerator = Boolean(user?.isModerator);

  const loadReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.listModerationReports();
      setReports(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load moderation reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isModerator) {
      loadReports();
    }
  }, [isAuthenticated, isModerator]);

  const handleResolve = async (
    reportId: string,
    action: 'hide' | 'dismiss' | 'warn' | 'restore'
  ) => {
    try {
      await api.resolveModerationReport(reportId, action);
      setActionSuccess(`Action '${action}' applied successfully to report.`);
      setTimeout(() => setActionSuccess(null), 3000);
      loadReports();
    } catch (err: any) {
      alert(err?.message || 'Failed to apply moderation action');
    }
  };

  const handleToggleLock = async (locked: boolean) => {
    if (!lockPostId.trim()) return;
    setIsLocking(true);
    setLockStatusMessage(null);
    try {
      const res = await api.togglePostLock(lockPostId.trim(), locked);
      setLockStatusMessage(
        `Discussion '${res.postId}' is now ${res.isLocked ? 'LOCKED' : 'UNLOCKED'}.`
      );
      setLockPostId('');
    } catch (err: any) {
      setLockStatusMessage(`Error: ${err?.message || 'Failed to update lock status'}`);
    } finally {
      setIsLocking(false);
    }
  };

  if (!isAuthenticated || !isModerator) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Moderator Access Restricted
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This workspace is strictly limited to authorized community moderators. If you require moderation privileges, contact the system administrator.
        </p>
        <Link to="/">
          <Button variant="secondary" size="sm">
            Return to Feed
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
        </Link>
        <Button
          size="sm"
          variant="outline"
          onClick={loadReports}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Queue
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 mb-2">
            <Shield className="w-3.5 h-3.5" />
            Moderator Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Community Reports & Moderation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review reported discussions and comments. Enforce community norms while preserving constructive debate (Wise et al., 2006).
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Thread Locking Quick Tool */}
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Discussion Lock Controls
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Prevent flame wars or coordinated brigading by freezing new comments on controversial discussions.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
          <input
            type="text"
            value={lockPostId}
            onChange={(e) => setLockPostId(e.target.value)}
            placeholder="Enter Post ID (e.g. post_001)..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isLocking || !lockPostId.trim()}
              onClick={() => handleToggleLock(true)}
              leftIcon={<Lock className="w-3.5 h-3.5 text-rose-500" />}
            >
              Lock Post
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isLocking || !lockPostId.trim()}
              onClick={() => handleToggleLock(false)}
              leftIcon={<Unlock className="w-3.5 h-3.5 text-emerald-500" />}
            >
              Unlock Post
            </Button>
          </div>
        </div>

        {lockStatusMessage && (
          <p className="text-xs font-mono text-blue-600 dark:text-blue-400 pt-1">
            {lockStatusMessage}
          </p>
        )}
      </Card>

      {/* Reports Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Reported Content Queue ({reports.length})
          </h3>
          <span className="text-xs text-slate-400">
            {reports.filter((r) => r.status === 'pending').length} pending review
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-2"
              >
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              No reports in queue
            </p>
            <p className="text-[11px] mt-0.5">The community feed is healthy and clear of reported violations.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => (
              <Card key={rep.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                      {rep.targetType}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Reported by @{rep.reporterUsername}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{formatTimeAgo(rep.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rep.status === 'pending'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : rep.status === 'resolved'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {rep.status}
                    </span>
                    {rep.targetStatus === 'hidden' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        Content Hidden
                      </span>
                    )}
                  </div>
                </div>

                {/* Reason & Description */}
                <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs space-y-1">
                  <div className="font-semibold text-rose-900 dark:text-rose-300">
                    Reason: {rep.reason}
                  </div>
                  {rep.description && (
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Reporter Notes: "{rep.description}"
                    </p>
                  )}
                </div>

                {/* Content Preview */}
                {rep.targetPreview && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Reported Snippet Preview:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 italic line-clamp-3">
                      "{rep.targetPreview}"
                    </p>
                  </div>
                )}

                {/* Moderator Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Target: {rep.targetId}
                    </span>
                    {rep.targetType === 'post' && (
                      <Link
                        to={`/posts/${rep.targetId}`}
                        target="_blank"
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        Inspect Post <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {rep.targetStatus === 'hidden' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(rep.id, 'restore')}
                        leftIcon={<Eye className="w-3.5 h-3.5 text-blue-500" />}
                      >
                        Restore Content
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleResolve(rep.id, 'hide')}
                        leftIcon={<EyeOff className="w-3.5 h-3.5" />}
                      >
                        Hide Content
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleResolve(rep.id, 'dismiss')}
                    >
                      Dismiss Report
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
