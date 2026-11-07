import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FolderKanban,
  Bookmark,
  Activity,
  Settings,
  Sparkles,
  Plus,
  MessageSquare,
  FileCode,
} from 'lucide-react';
import type { Project, PublicCommentRecent } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { ApkReleaseModal } from '../components/product/ApkReleaseModal';
import { formatCategoryLabel, formatTimeAgo } from '../lib/utils';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'projects';

  const [activeTab, setActiveTab] = useState<'projects' | 'saved' | 'activity'>(
    initialTab === 'saved' || initialTab === 'activity' ? initialTab : 'projects'
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [recentComments, setRecentComments] = useState<PublicCommentRecent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // APK Modal State
  const [selectedApkProject, setSelectedApkProject] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // 1. Load User's Owned Projects
      const userProjects = await api.getProjects();
      setProjects(userProjects);

      // 2. Load User's Bookmarked Items
      try {
        const saved = await api.getSavedPosts();
        setSavedPosts(saved);
      } catch {}

      // 3. Load Recent Activity
      try {
        const comments = await api.getRecentComments(20);
        setRecentComments(comments);
      } catch {}
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'projects' | 'saved' | 'activity') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[var(--accent)]/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center font-extrabold text-2xl ring-4 ring-[var(--accent)]/10">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
              {user?.displayName || 'Builder Profile'}
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              @{user?.username || 'user'}
            </p>
            {user?.bio && (
              <p className="text-xs text-[var(--text-secondary)] max-w-md pt-1">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/publish">
            <Button size="sm" className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Publish Project</span>
            </Button>
          </Link>

          <Link to="/settings">
            <Button variant="outline" size="sm" className="text-xs font-semibold flex items-center gap-1.5 border-[var(--border-default)] cursor-pointer">
              <Settings className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Settings</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border-default)] flex items-center gap-8 text-sm font-semibold">
        <button
          type="button"
          onClick={() => handleTabChange('projects')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'projects'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>My Projects ({projects.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('saved')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'saved'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Projects ({savedPosts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('activity')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Discussion Activity</span>
        </button>
      </div>

      {/* Tab Content: My Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)]">
              Loading your projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-[var(--border-default)] bg-[var(--surface)] space-y-4">
              <FolderKanban className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-60" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  You haven't published any projects yet
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  Share your application with the community, get grounded feedback, and test APK builds.
                </p>
              </div>
              <Link to="/publish">
                <Button size="sm" className="mt-2">
                  Publish Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-6 rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-sm shrink-0">
                          {project.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/projects/${project.id}`}
                            className="font-bold text-base text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate block"
                          >
                            {project.name}
                          </Link>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                            {formatCategoryLabel(project.category)}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          project.isPublic
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {project.isPublic ? 'Public' : 'Draft / Private'}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {project.tagline || project.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[var(--border-default)]/60">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1 text-[var(--accent)] font-semibold">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{project.reviewsCount || 0} Discussions</span>
                      </span>
                      <span>Created {formatTimeAgo(project.createdAt)}</span>
                    </div>

                    {/* Owner Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Link to={`/projects/${project.id}`}>
                        <Button size="sm" variant="outline" className="text-xs py-1.5 px-3 cursor-pointer">
                          Open Discussion
                        </Button>
                      </Link>

                      {project.isPublic ? (
                        <Link to={`/workspace?project=${project.id}`}>
                          <Button size="sm" className="text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Workspace</span>
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/projects/${project.id}/report`}>
                          <Button size="sm" variant="outline" className="text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer">
                            <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                            <span>AI Report</span>
                          </Button>
                        </Link>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedApkProject({ id: project.id, name: project.name })}
                        className="text-xs py-1.5 px-2.5 flex items-center gap-1 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>APK Releases</span>
                      </Button>

                      <Link to={`/personal/projects/${project.id}/setup`}>
                        <Button size="sm" variant="ghost" className="text-xs py-1.5 px-2 text-[var(--text-muted)] cursor-pointer" title="Setup & Ingestion">
                          <Settings className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Saved Projects */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedPosts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-[var(--border-default)] bg-[var(--surface)] text-xs text-[var(--text-muted)]">
              You haven't bookmarked any projects yet. Click the bookmark icon on any project page to save it here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/projects/${post.id}`}
                  className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/50 transition-all block text-left"
                >
                  <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1">
                    {post.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                    {post.description}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Activity */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          {recentComments.map((comment) => (
            <Link
              key={comment.id}
              to={`/projects/${comment.projectId}`}
              className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/40 transition-all flex items-start justify-between gap-4 block text-left"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                  {comment.projectTitle}
                </span>
                <p className="text-xs text-[var(--text-primary)] line-clamp-2 pt-1">
                  "{comment.content}"
                </p>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* APK Releases Modal */}
      {selectedApkProject && (
        <ApkReleaseModal
          isOpen={Boolean(selectedApkProject)}
          onClose={() => setSelectedApkProject(null)}
          projectId={selectedApkProject.id}
          projectName={selectedApkProject.name}
          isOwner={true}
        />
      )}
    </div>
  );
};
