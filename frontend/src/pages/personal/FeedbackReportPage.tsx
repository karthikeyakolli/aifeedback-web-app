import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import type { Project } from '../../types';
import { ProjectReviewTab } from '../../components/product/ProjectReviewTab';
import { Button } from '../../components/common/Button';

export const FeedbackReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    api.getProject(id)
      .then((data) => {
        setProject(data);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load project details.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="w-40 h-4 bg-[var(--surface-hover)] rounded-md" />
        <div className="w-2/3 h-8 bg-[var(--surface-hover)] rounded-md" />
        <div className="h-64 bg-[var(--surface)] border border-[var(--border-default)] rounded-2xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto text-rose-500" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Project Not Found</h2>
        <p className="text-xs text-[var(--text-muted)]">
          {error || 'The project could not be found or you do not have permission to view its feedback report.'}
        </p>
        <Link to="/personal">
          <Button variant="outline" size="sm">
            Back to Personal Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div className="space-y-1">
          <Link
            to="/personal"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Personal Projects</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {project.name}
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-muted)]">
              {project.category}
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] line-clamp-1">
            {project.tagline}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/personal/projects/${project.id}/setup`}>
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              <span>Project Setup</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Review Surface */}
      <ProjectReviewTab
        project={project}
        onProjectUpdated={() => {
          if (id) api.getProject(id).then(setProject).catch(console.error);
        }}
        onSwitchToContextTab={() => navigate(`/personal/projects/${project.id}/setup`)}
      />
    </div>
  );
};
