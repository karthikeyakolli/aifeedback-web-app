import React from 'react';
import { DeveloperWorkspace } from '../components/dev/DeveloperWorkspace';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';

export const DeveloperWorkspacePage: React.FC = () => {
  // Strict Production Guard
  if (!import.meta.env.DEV) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 mb-4">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Developer Workspace Disabled
        </h1>
        <p className="text-xs text-[var(--text-muted)] max-w-md mt-2 mb-6">
          The Developer Workspace and AI Testing Lab endpoints are disabled in production environments for system security and data isolation.
        </p>
        <Link to="/">
          <Button variant="primary" size="sm">
            Return to Community Feed
          </Button>
        </Link>
      </div>
    );
  }

  return <DeveloperWorkspace />;
};
