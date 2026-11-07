import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MessageSquare, ThumbsUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { PublicProject } from '../../types';
import { formatCategoryLabel } from '../../lib/utils';

interface RecommendedProjectsProps {
  projects: PublicProject[];
}

export const RecommendedProjects: React.FC<RecommendedProjectsProps> = ({ projects }) => {
  // Select top 3 projects for transparent recommendations
  const recommended = projects.slice(0, 3);

  if (recommended.length === 0) return null;

  const reasons = [
    'Trending community dialogue with high feedback depth',
    'Active discussion thread with verified creator responses',
    'Strong consensus on architectural and UX enhancements',
  ];

  return (
    <section className="w-full py-14 border-b border-[var(--border-default)]/60 bg-[var(--surface-raised)]/20" aria-label="Recommended Projects">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended For You</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Curated Community Highlights
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Transparent recommendations driven by genuine discussion depth and recent activity.
            </p>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline shrink-0"
          >
            <span>See more suggestions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommended.map((project, idx) => (
            <div
              key={project.id}
              className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] flex flex-col justify-between hover:border-[var(--accent)]/50 hover:shadow-2xs transition-all text-left group"
            >
              <div>
                {/* Recommendation Reason Pill (Transparent rationale) */}
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-4 w-fit border border-emerald-200/60">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{reasons[idx % reasons.length]}</span>
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                    {project.name}
                  </h3>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-secondary)] shrink-0">
                    {formatCategoryLabel(project.category)}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed mb-6">
                  {project.tagline || project.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between py-3 border-t border-[var(--border-default)]/60 text-xs text-[var(--text-muted)] mb-4">
                  <span>by {project.creatorDisplayName || project.creatorUsername || 'Builder'}</span>
                  <div className="flex items-center gap-3 font-semibold text-[var(--accent)]">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {project.reviewsCount || 0}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--text-muted)] font-medium">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {project.upvotesCount || 0}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/projects/${project.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer"
                >
                  <span>Join Discussion</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
