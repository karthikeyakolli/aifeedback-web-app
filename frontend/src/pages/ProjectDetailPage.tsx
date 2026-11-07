import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ExternalLink,
  GitBranch,
  Bookmark,
  Share2,
  Check,
  Sparkles,
  Settings,
  MessageSquare,
  Search,
  ThumbsUp,
  FileCode,
  ChevronLeft,
  Cpu,
  Download,
  ShieldCheck,
  GitCommit,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import type { PublicProject, Comment, FeedbackReport, FindingEvidenceCitation, ProjectApkRelease, ProjectChangelogEntry } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { CommentComposer } from '../components/discussion/CommentComposer';
import { CommentThread } from '../components/discussion/CommentThread';
import { ApkReleaseModal } from '../components/product/ApkReleaseModal';
import { ProjectChatTab } from '../components/product/ProjectChatTab';
import { formatCategoryLabel, formatTimeAgo } from '../lib/utils';
import { playHapticPop } from '../lib/haptics';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [project, setProject] = useState<PublicProject | any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [apkReleases, setApkReleases] = useState<ProjectApkRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [discussionSearch, setDiscussionSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'discussion' | 'changelog' | 'ai-chat' | 'report' | 'releases'>('discussion');

  // Changelog State
  const [changelogEntries, setChangelogEntries] = useState<ProjectChangelogEntry[]>([]);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [clVersion, setClVersion] = useState('v1.0.1');
  const [clTitle, setClTitle] = useState('');
  const [clDescription, setClDescription] = useState('');
  const [clFindingId, setClFindingId] = useState('');
  const [clSubmitting, setClSubmitting] = useState(false);

  // APK Modal State
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    if (!id) return;
    setIsLoading(true);
    setIsNotFound(false);

    try {
      // 1. Load project details (public projection or personal)
      let projData: any = null;
      try {
        projData = await api.getPublicProject(id);
      } catch {
        projData = await api.getProject(id);
      }

      if (!projData) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      setProject(projData);
      setUpvotes(projData.upvotesCount || 0);

      // 2. Load threaded comments
      const commentList = await api.getComments(id);
      setComments(commentList);

      // 3. Check for public/approved feedback report
      try {
        const rep = await api.getPublicFeedbackReport(id);
        setReport(rep);
      } catch {
        setReport(null);
      }

      // 4. Load APK releases
      try {
        const apks = await api.getProjectApkReleases(id);
        setApkReleases(apks || []);
      } catch {}

      // 5. Load Changelog & Feedback Fixes
      try {
        const cl = await api.getProjectChangelog(id);
        setChangelogEntries(cl || []);
      } catch {}
    } catch (err) {
      console.error('Failed to load project details:', err);
      setIsNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishChangelog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !clTitle.trim() || !clDescription.trim()) return;
    setClSubmitting(true);
    try {
      const created = await api.createProjectChangelog(id, {
        versionTag: clVersion.trim() || 'v1.0.0',
        title: clTitle.trim(),
        description: clDescription.trim(),
        findingId: clFindingId || undefined,
        isPublic: true,
      });
      setChangelogEntries((prev) => [created, ...prev]);
      setIsChangelogModalOpen(false);
      setClTitle('');
      setClDescription('');
      setClFindingId('');
    } catch (err) {
      console.error('Failed to publish changelog entry:', err);
    } finally {
      setClSubmitting(false);
    }
  };

  const handleDeleteChangelog = async (entryId: string) => {
    if (!id || !confirm('Are you sure you want to delete this changelog entry?')) return;
    try {
      await api.deleteProjectChangelog(id, entryId);
      setChangelogEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err) {
      console.error('Failed to delete changelog entry:', err);
    }
  };

  // Determine if requesting user is the project owner
  const isOwner = Boolean(
    user &&
      project &&
      (project.userId === user.id ||
        project.user_id === user.id ||
        project.creatorUsername === user.username)
  );

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const next = !isBookmarked;
    setIsBookmarked(next);
    if (id) {
      try {
        await api.toggleBookmarkPost(id);
      } catch {}
    }
  };

  const handleToggleUpvote = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!id || isVoting) return;
    setIsVoting(true);

    const willUpvote = !hasUpvoted;
    playHapticPop(willUpvote ? 620 : 380);

    const prevCount = upvotes;
    const prevStatus = hasUpvoted;
    const nextCount = willUpvote ? prevCount + 1 : Math.max(0, prevCount - 1);

    setUpvotes(nextCount);
    setHasUpvoted(willUpvote);
    setProject((prev: any) => (prev ? { ...prev, upvotesCount: nextCount } : prev));

    try {
      const res = await api.upvotePublicProject(id);
      if (res && typeof res.upvotesCount === 'number') {
        setUpvotes(res.upvotesCount);
        setHasUpvoted(Boolean(res.hasUpvoted));
        setProject((prev: any) => (prev ? { ...prev, upvotesCount: res.upvotesCount } : prev));
      }
    } catch {
      setUpvotes(prevCount);
      setHasUpvoted(prevStatus);
      setProject((prev: any) => (prev ? { ...prev, upvotesCount: prevCount } : prev));
    } finally {
      setIsVoting(false);
    }
  };

  // Add Comment Handler
  const handleAddComment = async (content: string, isAnonymous: boolean, parentCommentId?: string) => {
    if (!id) return;
    try {
      const newComment = await api.addComment({
        postId: id,
        content,
        isAnonymous,
        parentCommentId,
      });

      if (parentCommentId) {
        // Nested reply
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentCommentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newComment],
              };
            }
            return c;
          })
        );
      } else {
        // Top-level comment
        setComments((prev) => [newComment, ...prev]);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to post message to discussion');
    }
  };

  // Filter comments by in-thread search
  const filteredComments = useMemo(() => {
    if (!discussionSearch.trim()) return comments;
    const q = discussionSearch.toLowerCase();
    return comments.filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        c.author?.displayName.toLowerCase().includes(q) ||
        c.author?.username.toLowerCase().includes(q)
    );
  }, [comments, discussionSearch]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-[var(--surface-raised)] rounded-md" />
        <div className="h-44 bg-[var(--surface)] border border-[var(--border-default)] rounded-3xl" />
        <div className="h-96 bg-[var(--surface)] border border-[var(--border-default)] rounded-3xl" />
      </div>
    );
  }

  if (isNotFound || !project) {
    return (
      <div className="max-w-lg mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] font-bold text-xl">
          ?
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Project Not Found</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          The requested application could not be found or has been made private by its creator.
        </p>
        <Link to="/explore">
          <Button variant="primary" size="sm" className="mt-2">
            Back to Explore
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link to="/explore" className="hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Explore Projects</span>
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-medium truncate max-w-xs">{project.name}</span>
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* 1. Compact Project Overview Header                                      */}
      {/* ----------------------------------------------------------------------- */}
      <div className="relative p-6 sm:p-8 rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] shadow-xs space-y-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[var(--accent)] border border-blue-200/70 flex items-center justify-center font-extrabold text-2xl shadow-xs shrink-0">
              {project.name.charAt(0)}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight truncate">
                  {project.name}
                </h1>
                <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                  {formatCategoryLabel(project.category)}
                </span>
                {project.isPublic && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Public Community
                  </span>
                )}
              </div>

              {/* Creator Attribution */}
              <p className="text-xs text-[var(--text-muted)]">
                Created by{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  {project.creatorDisplayName || project.creatorUsername || 'Community Builder'}
                </span>
                {project.creatorUsername && (
                  <span className="ml-1 font-mono text-[11px]">@{project.creatorUsername}</span>
                )}
                {' • '}
                <span>Published {formatTimeAgo(project.createdAt)}</span>
              </p>
            </div>
          </div>

          {/* Social & Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start">
            {/* Interactive Upvote Pill */}
            <button
              type="button"
              onClick={handleToggleUpvote}
              disabled={isVoting}
              aria-label={hasUpvoted ? 'Remove upvote' : 'Upvote project'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                hasUpvoted
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-xs'
                  : 'bg-[var(--surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
              <span>{upvotes}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark project'}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-[var(--surface)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={handleShare}
              aria-label="Share project"
              className="p-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Direct Link to Global AI Workspace */}
            <Link to={`/workspace?project=${project.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 border-[var(--border-default)] text-xs font-semibold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>AI Workspace</span>
              </Button>
            </Link>

            {/* Android APK Releases trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsApkModalOpen(true)}
              className="flex items-center gap-1.5 border-[var(--border-default)] text-xs font-semibold cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-500" />
              <span>Android APK</span>
            </Button>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
          {project.tagline || project.description}
        </p>

        {/* Links & Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border-default)]/60 text-xs text-[var(--text-muted)]">
          <div className="flex flex-wrap items-center gap-4">
            {project.repositoryUrl && (
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline font-semibold"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Source Code</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Live Application</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <strong>{comments.length}</strong> community messages
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              <strong>{project.upvotesCount || 0}</strong> upvotes
            </span>
            {apkReleases.length > 0 && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <FileCode className="w-3.5 h-3.5" />
                <strong>{apkReleases.length}</strong> APK build{apkReleases.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* 2. Owner Controls Bar (Visible exclusively to project owner)             */}
      {/* ----------------------------------------------------------------------- */}
      {isOwner && (
        <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-raised)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[var(--accent)] border border-blue-200/70 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">
                Creator Administration Bar
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                You own this project. Manage releases, inspect citations, and configure knowledge sources.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to={`/workspace?project=${project.id}`}>
              <Button size="sm" className="text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open in AI Workspace</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsApkModalOpen(true)}
              className="text-xs font-semibold flex items-center gap-1.5 border-[var(--border-default)] cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-500" />
              <span>Manage Releases & APK</span>
            </Button>

            <Link to={`/personal/projects/${project.id}/setup`}>
              <Button variant="ghost" size="sm" className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <Settings className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Setup & Sources</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 3. Navigation Tabs: Discussion, AI Answering, Findings, Releases        */}
      {/* ----------------------------------------------------------------------- */}
      <div className="border-b border-[var(--border-default)] flex items-center gap-6 text-sm font-semibold overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('discussion')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'discussion'
              ? 'border-[var(--accent)] text-[var(--accent)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Public Discussion ({comments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('changelog')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'changelog'
              ? 'border-[var(--accent)] text-[var(--accent)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <GitCommit className="w-4 h-4 text-cyan-500" />
          <span>Changelog & Fixes ({changelogEntries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai-chat')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ai-chat'
              ? 'border-[var(--accent)] text-[var(--accent)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          <span>AI Answering Assistant</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 text-[var(--accent)] border border-blue-200 font-bold">
            RAG
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('report')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'report'
              ? 'border-[var(--accent)] text-[var(--accent)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Cpu className="w-4 h-4 text-indigo-500" />
          <span>AI Verified Findings ({report?.findings?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('releases')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'releases'
              ? 'border-[var(--accent)] text-[var(--accent)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileCode className="w-4 h-4 text-emerald-500" />
          <span>Releases & APKs ({apkReleases.length})</span>
        </button>
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* 4. Tab 1: Public Group Discussion                                       */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'discussion' && (
        <div className="space-y-6">
          {/* Comment Composer */}
          <div className="p-6 rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] shadow-xs">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">
              Join the Public Project Discussion
            </h3>
            <CommentComposer
              postId={project.id}
              onSubmit={handleAddComment}
              placeholder="Share constructive feedback, report friction, request features, or ask the creator a question..."
            />
          </div>

          {/* Search within Discussion & Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Community Messages ({filteredComments.length})
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={discussionSearch}
                onChange={(e) => setDiscussionSearch(e.target.value)}
                placeholder="Search this discussion..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Comment List */}
          {filteredComments.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-[var(--border-default)] bg-[var(--surface)]/40 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-60" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                No discussion messages yet
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Be the first to share constructive feedback or ask questions about {project.name}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] shadow-xs"
                >
                  <CommentThread
                    comment={comment}
                    postId={project.id}
                    onAddReply={handleAddComment}
                    postAuthorId={project.userId || project.user_id}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 4. Tab 2: Project Changelog & Community Feedback Fixes                 */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'changelog' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Action Banner */}
          <div className="p-6 rounded-3xl border border-[var(--border-default)] bg-[var(--surface)]/70 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Feedback Loop</span>
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Changelog & Community Feedback Fixes
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Track how user discussions and AI audits translate into released product improvements.
              </p>
            </div>

            {isOwner && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsChangelogModalOpen(true)}
                className="gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Release Update</span>
              </Button>
            )}
          </div>

          {/* Changelog Entries List */}
          {changelogEntries.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-[var(--border-default)] bg-[var(--surface)]/40 space-y-2">
              <GitCommit className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                No Changelog Releases Yet
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                {isOwner
                  ? "Publish your first release note above to show your community that their feedback is addressed!"
                  : "The creator hasn't published any changelog release updates yet. Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {changelogEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)]/70 backdrop-blur-md space-y-3 relative group shadow-sm hover:border-[var(--border-focus)] transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        {entry.versionTag}
                      </span>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        {entry.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span>{formatTimeAgo(entry.createdAt)}</span>
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteChangelog(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Addressed AI Finding Badge */}
                  {entry.findingTitle && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-600 dark:text-purple-400">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-semibold">Resolved AI Finding:</span>
                      <span className="truncate">{entry.findingTitle}</span>
                      {entry.findingSeverity && (
                        <span className="text-[10px] uppercase font-mono px-1 rounded bg-purple-500/20">
                          {entry.findingSeverity}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                    {entry.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Modal for Creator to Publish Changelog Entry */}
          {isChangelogModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
              <div className="w-full max-w-lg rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-cyan-500" />
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      Publish Release Update
                    </h4>
                  </div>
                  <button
                    onClick={() => setIsChangelogModalOpen(false)}
                    className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handlePublishChangelog} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--text-primary)]">
                      Version / Milestone Tag
                    </label>
                    <input
                      type="text"
                      value={clVersion}
                      onChange={(e) => setClVersion(e.target.value)}
                      placeholder="e.g. v1.1.0 or Sprint 3 Fixes"
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--text-primary)]">
                      Update Title
                    </label>
                    <input
                      type="text"
                      value={clTitle}
                      onChange={(e) => setClTitle(e.target.value)}
                      placeholder="e.g. Fixed OAuth JWT expiration bug reported in reviews"
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                  </div>

                  {/* Optional: Link addressed AI finding */}
                  {report?.findings && report.findings.length > 0 && (
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--text-primary)]">
                        Link Addressed AI Finding (Optional)
                      </label>
                      <select
                        value={clFindingId}
                        onChange={(e) => setClFindingId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                      >
                        <option value="">None (Independent release update)</option>
                        {report.findings.map((f: any) => (
                          <option key={f.id} value={f.id}>
                            [{f.severity?.toUpperCase()}] {f.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--text-primary)]">
                      Release Description & Details
                    </label>
                    <textarea
                      rows={4}
                      value={clDescription}
                      onChange={(e) => setClDescription(e.target.value)}
                      placeholder="Explain what was improved, what bugs were resolved, or how user community feedback guided this release..."
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangelogModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={clSubmitting || !clTitle.trim() || !clDescription.trim()}
                    >
                      {clSubmitting ? 'Publishing...' : 'Publish Update'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 5. Tab 3: AI Answering Assistant & Publisher Workspace                  */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'ai-chat' && (
        <div className="space-y-4">
          {isOwner ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span>
                    You are in your project's AI assistant. Want the multi-mode intelligence studio?
                  </span>
                </div>
                <Link to={`/workspace?project=${project.id}`}>
                  <Button size="sm" className="text-xs font-semibold py-1 px-3 cursor-pointer shrink-0">
                    Open Dedicated AI Workspace
                  </Button>
                </Link>
              </div>
              <ProjectChatTab project={project} />
            </div>
          ) : (
            <div className="p-10 text-center rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-[var(--accent)] border border-blue-200 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Publisher AI Workspace
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  The AI Answering Workspace is reserved for the publisher of {project.name}. As a community member, you can participate in public discussions or view the publisher's verified findings report.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="sm"
                  onClick={() => setActiveTab('discussion')}
                  className="text-xs font-semibold cursor-pointer"
                >
                  Join Public Discussion
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('report')}
                  className="text-xs font-semibold border-[var(--border-default)] cursor-pointer"
                >
                  View Verified Findings
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 6. Tab 3: AI Verified Findings Report                                   */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {report ? (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Grounded Feedback Intelligence</span>
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Executive Feedback Synthesis
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Synthesized by FeedbackAI with strict evidence citations across private project source documents and public community dialogue.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[var(--border-default)]/60 text-center">
                  <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)]">
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {report.totalFindingsCount || report.findings?.length || 0}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">Verified Issues</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)]">
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {comments.length}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">Inputs Analyzed</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)]">
                    <p className="text-lg font-bold text-red-500">
                      {report.highCount || 0}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">High Severity</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)]">
                    <p className="text-lg font-bold text-emerald-500">
                      {report.findings?.length || 0}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">Total Findings</p>
                  </div>
                </div>
              </div>

              {/* Finding Cards */}
              <div className="space-y-4">
                {report.findings?.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            finding.severity === 'high' || finding.severity === 'blocker'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : finding.severity === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {finding.severity}
                        </span>
                        <h4 className="text-sm font-bold text-[var(--text-primary)] pt-1">
                          {finding.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {finding.observation || finding.evidenceQuote}
                    </p>

                    {/* Evidence Citations */}
                    {finding.citations && finding.citations.length > 0 && (
                      <div className="pt-3 border-t border-[var(--border-default)]/60 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Source Evidence & Citations:</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {finding.citations.map((cite: FindingEvidenceCitation, i: number) => (
                            <span
                              key={i}
                              className="text-[10px] px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-secondary)] truncate max-w-sm"
                            >
                              "{cite.canonicalQuote || cite.contentHash || 'Verified comment quote'}"
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl border border-dashed border-[var(--border-default)] bg-[var(--surface)] space-y-4">
              <Cpu className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-60" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  No AI Feedback Synthesis Generated Yet
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                  {isOwner
                    ? 'Synthesize community feedback, identify high-priority bugs, and generate actionable improvement tasks.'
                    : 'The project owner has not generated an executive AI report yet.'}
                </p>
              </div>

              {isOwner && (
                <Link to={`/projects/${project.id}/report`}>
                  <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate First AI Review</span>
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 7. Tab 4: Releases & Android APKs                                       */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'releases' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-emerald-500" />
                  <span>Android APK Releases</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Quarantined and verified application builds with cryptographic SHA-256 integrity checks.
                </p>
              </div>

              {isOwner && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsApkModalOpen(true)}
                  className="text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Upload New APK</span>
                </Button>
              )}
            </div>

            {apkReleases.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)] space-y-2">
                <FileCode className="w-10 h-10 mx-auto opacity-50 text-[var(--text-muted)]" />
                <p className="font-semibold text-sm text-[var(--text-primary)]">No Android APK Releases Yet</p>
                <p>The creator hasn't published an Android build for {project.name}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apkReleases.map((release) => (
                  <div
                    key={release.id}
                    className="p-4 sm:p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-raised)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--text-primary)]">
                          {release.versionName || 'v1.0'}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          Build #{release.versionCode || 1}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          release.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {release.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-mono truncate">
                        SHA-256: {release.fileSha256}
                      </p>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {release.fileSizeBytes ? `${(release.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : 'Size unknown'} • {release.downloadCount || 0} downloads
                      </span>
                    </div>

                    <div className="shrink-0">
                      <a
                        href={`/api/v1/projects/${project.id}/releases/apk/${release.id}/download`}
                        download
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-semibold gap-1.5 border-[var(--border-default)] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Download APK</span>
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* APK Release Management & Download Modal */}
      <ApkReleaseModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
        isOwner={isOwner}
      />
    </div>
  );
};
