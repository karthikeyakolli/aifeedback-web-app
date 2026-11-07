import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  GitBranch,
  Globe,
  Sparkles,
  Layers,
  Shield,
  Calendar,
} from 'lucide-react';
import type { PublicCreatorProfile } from '../../types';
import { api } from '../../services/api';
import { PublicProjectCard } from '../../components/public/PublicProjectCard';
import { Button } from '../../components/common/Button';

export const PublicCreatorProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();

  const [creator, setCreator] = useState<PublicCreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    setIsLoading(true);
    setIsNotFound(false);

    api.getPublicCreatorProfile(username)
      .then((data) => {
        setCreator(data);
      })
      .catch(() => {
        setIsNotFound(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [username]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-8 animate-pulse">
        <div className="w-32 h-4 bg-[var(--surface-hover)] rounded-md" />
        <div className="h-44 bg-[var(--surface)] border border-[var(--border-default)] rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-48 bg-[var(--surface)] border border-[var(--border-default)] rounded-2xl" />
          <div className="h-48 bg-[var(--surface)] border border-[var(--border-default)] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isNotFound || !creator) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)] flex items-center justify-center">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Creator Not Found</h2>
        <p className="text-xs text-[var(--text-muted)]">
          The requested maker profile "@{username}" does not exist or has not created a public showcase.
        </p>
        <Link to="/explore">
          <Button variant="primary" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Explore Public Projects</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link to="/explore" className="hover:text-[var(--text-primary)] flex items-center gap-1 font-medium">
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Public Explore</span>
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-semibold">@{creator.username}</span>
      </div>

      {/* 2. Hero Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[var(--accent)] border border-blue-200/70 flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
              {creator.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                {creator.displayName}
              </h1>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="font-mono">@{creator.username}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Joined {new Date(creator.joinedAt).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Maker Stats */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] text-center">
              <div className="text-lg font-black text-[var(--text-primary)]">
                {creator.totalPublishedProjects}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Showcases
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {creator.totalUpvotesReceived}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Upvotes
              </div>
            </div>
          </div>
        </div>

        {/* Biography */}
        {creator.bio && (
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            {creator.bio}
          </p>
        )}

        {/* Technical Skills & External Links */}
        <div className="pt-4 border-t border-[var(--border-default)] flex flex-wrap items-center justify-between gap-3">
          {creator.skills && creator.skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mr-1">
                Stack:
              </span>
              {creator.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-0.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {(creator.githubUrl || creator.websiteUrl) && (
            <div className="flex items-center gap-2">
              {creator.githubUrl && (
                <a
                  href={creator.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>
              )}

              {creator.websiteUrl && (
                <a
                  href={creator.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-sky-500" />
                  <span>Website</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Published Project Showcases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Verified Project Showcases ({creator.publishedProjects.length})
            </h2>
          </div>
        </div>

        {creator.publishedProjects.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface)] text-center space-y-2">
            <Layers className="w-8 h-8 mx-auto text-[var(--text-muted)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">No Public Showcases Yet</h3>
            <p className="text-xs text-[var(--text-muted)]">
              This creator has not published any projects to Public Space yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {creator.publishedProjects.map((project) => (
              <PublicProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* 4. Server-Side Data Protection Notice */}
      <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] flex items-start gap-3 text-xs text-[var(--text-muted)]">
        <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-[var(--text-primary)]">Strict Privacy Projection: </strong>
          Private projects, personal working notes, and account email addresses are permanently quarantined and strictly excluded from public maker profiles.
        </div>
      </div>
    </div>
  );
};
