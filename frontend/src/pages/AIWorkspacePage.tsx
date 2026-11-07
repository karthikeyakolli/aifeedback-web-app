import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  MessageSquare,
  FileText,
  Radio,
  Layers,
  ChevronDown,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  FolderKanban,
  ShieldCheck,
  AlertCircle,
  Plus,
  Lock,
  ArrowRight,
  Settings,
  Columns,
  ListFilter,
  RefreshCw,
  BookOpen,
  Download,
  Check,
  ChevronUp,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Project, FeedbackReport, ProjectSource, FeedbackFinding } from '../types';
import { ProjectChatTab } from '../components/product/ProjectChatTab';
import { Button } from '../components/common/Button';
import { formatCategoryLabel } from '../lib/utils';
import { playHapticPop } from '../lib/haptics';

export const AIWorkspacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [sources, setSources] = useState<ProjectSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unauthorizedNotice, setUnauthorizedNotice] = useState<string | null>(null);

  // Active Workspace Mode
  const [workspaceMode, setWorkspaceMode] = useState<'assistant' | 'findings' | 'audio' | 'sources'>('assistant');

  // Findings Kanban / Task Workspace State
  const [findingsView, setFindingsView] = useState<'kanban' | 'list'>('kanban');
  const [findingCategoryFilter, setFindingCategoryFilter] = useState<string>('all');
  const [selectedFindingForEvidence, setSelectedFindingForEvidence] = useState<FeedbackFinding | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  // Audio Briefing Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);

  // Load user's published projects
  useEffect(() => {
    loadUserPublishedProjects();
  }, [isAuthenticated, user?.id]);

  const loadUserPublishedProjects = async () => {
    setIsLoading(true);
    setUnauthorizedNotice(null);

    if (!isAuthenticated) {
      setProjects([]);
      setSelectedProject(null);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch personal projects belonging to the authenticated user
      const personalList = await api.getPersonalProjects();

      // 2. Filter strictly for published projects (isPublic == true or status == 'published')
      const published = personalList.filter(
        (p) => Boolean(p.isPublic || (p as any).is_public || p.status === 'published')
      );

      setProjects(published);

      // Check query param
      const queryProj = searchParams.get('project');
      if (queryProj) {
        const found = published.find((p) => p.id === queryProj);
        if (found) {
          setSelectedProjectId(found.id);
        } else {
          // If project was requested via URL but does not belong to user's published projects:
          try {
            const otherProj = await api.getPublicProject(queryProj).catch(() => null);
            setUnauthorizedNotice(
              `"${otherProj?.name || queryProj}" is published by another creator. The AI Workspace operates exclusively on your published applications.`
            );
          } catch {
            setUnauthorizedNotice(
              `Project "${queryProj}" is not among your published products.`
            );
          }
          setSelectedProjectId(published[0]?.id || '');
        }
      } else {
        setSelectedProjectId(published[0]?.id || '');
      }
    } catch (err) {
      console.error('Failed to load published projects for workspace:', err);
      setProjects([]);
      setSelectedProject(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Load project details, report, and sources when selectedProjectId changes
  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProject(null);
      setReport(null);
      setSources([]);
      return;
    }

    setSearchParams({ project: selectedProjectId });

    const proj = projects.find((p) => p.id === selectedProjectId) || null;
    setSelectedProject(proj);

    // Load report
    api.getPublicFeedbackReport(selectedProjectId)
      .then(setReport)
      .catch(() => setReport(null));

    // Load sources
    api.listProjectSources(selectedProjectId)
      .then(setSources)
      .catch(() => setSources([]));
  }, [selectedProjectId, projects]);

  // Podcast Script for Audio Briefing
  const podcastScript = [
    {
      host: 'Alex',
      text: `Welcome to the FeedbackAI Deep Dive. Today we are analyzing your published product, ${selectedProject?.name || 'your application'}, focusing on customer friction, verified findings, and architectural consensus.`,
    },
    {
      host: 'Jordan',
      text: `That is right. Looking across the community feedback and ingested specifications, users are particularly vocal about sync reliability, performance responsiveness, and UX clarity.`,
    },
    {
      host: 'Alex',
      text: `Exactly. The AI synthesis generated ${report?.findings?.length || 4} key findings, with ${report?.highCount || 1} marked as high priority.`,
    },
    {
      host: 'Jordan',
      text: `Let us examine the evidence. Reviewers noted that local interactions feel immediate, but cross-device sync encounters edge-case race conditions during simultaneous edits.`,
    },
    {
      host: 'Alex',
      text: `The recommended fix is adopting a state-based CRDT or vector clock mechanism, as outlined in the engineering improvement roadmap.`,
    },
  ];

  // Speech synthesis playback
  const togglePlayAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    playSegment(currentAudioIndex);
  };

  const playSegment = (index: number) => {
    if (index >= podcastScript.length) {
      setIsPlayingAudio(false);
      setCurrentAudioIndex(0);
      return;
    }

    setCurrentAudioIndex(index);
    const item = podcastScript[index];
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = 1.05;
    utterance.pitch = item.host === 'Alex' ? 1.0 : 1.15;

    utterance.onend = () => {
      playSegment(index + 1);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const resetAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setCurrentAudioIndex(0);
  };

  const handleUpdateFindingStatus = async (
    findingId: string,
    nextStatus: 'open' | 'in_progress' | 'addressed'
  ) => {
    playHapticPop(nextStatus === 'addressed' ? 700 : 500);

    // Optimistic local update in report
    setReport((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        findings: (prev.findings || []).map((f) =>
          f.id === findingId ? { ...f, status: nextStatus } : f
        ),
      };
    });

    if (selectedFindingForEvidence?.id === findingId) {
      setSelectedFindingForEvidence((prev) =>
        prev ? { ...prev, status: nextStatus } : null
      );
    }

    try {
      await api.updateFindingStatus(findingId, nextStatus);
    } catch (err) {
      console.error('Failed to update finding status:', err);
    }
  };

  const handleRunAIReview = async () => {
    if (!selectedProjectId || isGeneratingReport) return;
    setIsGeneratingReport(true);
    playHapticPop(600);

    try {
      await api.startAIReview(selectedProjectId, {
        focus_areas: ['performance', 'ux', 'architecture', 'reliability'],
      });

      // Poll for refreshed findings report
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        try {
          const rep = await api.getPublicFeedbackReport(selectedProjectId);
          if (rep && rep.findings && rep.findings.length > 0) {
            setReport(rep);
            clearInterval(poll);
            setIsGeneratingReport(false);
            playHapticPop(750);
            return;
          }
        } catch {}

        if (attempts >= 6) {
          clearInterval(poll);
          setIsGeneratingReport(false);
          api.getPublicFeedbackReport(selectedProjectId).then(setReport).catch(() => {});
        }
      }, 1500);
    } catch (err: any) {
      console.error('Failed to trigger review:', err);
      setIsGeneratingReport(false);
    }
  };

  const handleExportFindingsReport = async () => {
    if (!report || !selectedProject) return;
    try {
      const markdown = `# AI Product Intelligence Report: ${selectedProject.name}
**Generated**: ${new Date(report.createdAt || Date.now()).toLocaleDateString()}
**Status**: ${selectedProject.status} | **Category**: ${selectedProject.category}

## Executive Summary
${report.executiveSummary || 'No executive summary provided.'}

## Key Strengths
${report.strengthsSummary || 'No key strengths recorded.'}

## Verified Findings & Engineering Tasks (${report.findings?.length || 0})
${(report.findings || [])
  .map(
    (f, i) => `
### ${i + 1}. [${f.severity.toUpperCase()}] ${f.title || f.category} (Status: ${f.status || 'open'})
- **Observation**: ${f.observation}
- **Ground Truth Evidence**: "${f.evidenceQuote || f.citations?.[0]?.canonicalQuote || 'Direct user feedback telemetry'}"
- **Recommendation**: ${f.recommendation || 'N/A'}
`
  )
  .join('\n')}
`;
      await navigator.clipboard.writeText(markdown);
      setCopiedExport(true);
      playHapticPop(650);
      setTimeout(() => setCopiedExport(false), 2000);
    } catch (err) {
      console.error('Failed to copy report:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Case A: Loading State
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[var(--text-muted)]">
          Loading your published projects...
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Case B: User Not Authenticated
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="p-8 sm:p-12 text-center rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] space-y-6 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 text-[var(--accent)] border border-blue-200/80 flex items-center justify-center shadow-2xs">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
              Creator Intelligence Studio
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Sign In to Access Your AI Workspace
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              The AI Workspace works exclusively for your published applications. Sign in to query community feedback with AI, inspect grounded citations, listen to audio briefings, and track engineering tasks.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => openAuthModal('login')}
              className="text-xs font-semibold gap-2 shadow-xs cursor-pointer py-2 px-5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In to Access Workspace</span>
            </Button>
            <Link to="/explore">
              <Button
                variant="outline"
                className="text-xs font-semibold border-[var(--border-default)] cursor-pointer py-2 px-5"
              >
                <span>Browse Public Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Case C: Authenticated but 0 Published Projects
  // ---------------------------------------------------------------------------
  if (projects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="p-8 sm:p-12 text-center rounded-3xl border border-dashed border-[var(--border-default)] bg-[var(--surface)] space-y-6 shadow-2xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[var(--surface-raised)] text-[var(--text-muted)] border border-[var(--border-default)] flex items-center justify-center">
            <FolderKanban className="w-8 h-8 opacity-70" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              0 Published Projects
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              No Published Projects Found
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              The AI Workspace is reserved exclusively for applications you have published. Once you publish a project, you can query feedback, analyze verified findings, review evidence citations, and listen to AI audio briefings.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/publish">
              <Button variant="primary" className="text-xs font-semibold gap-2 shadow-xs py-2 px-5 cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>Publish Your Application</span>
              </Button>
            </Link>
            <Link to="/explore">
              <Button
                variant="outline"
                className="text-xs font-semibold border-[var(--border-default)] cursor-pointer py-2 px-5"
              >
                <span>Explore Community Showcase</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Case D: Authenticated with Published Projects
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Notice if an unauthorized project was requested via URL */}
      {unauthorizedNotice && (
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 flex items-start justify-between gap-3 text-xs leading-relaxed shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Access Restricted to Your Published Projects</p>
              <p className="text-[11px] text-amber-800 mt-0.5">{unauthorizedNotice}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUnauthorizedNotice(null)}
            className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Header & Published Project Selector */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[var(--accent)] border border-blue-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Publisher Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Product Intelligence Studio
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
            Query feedback on your published applications, investigate grounded evidence citations, listen to conversational audio briefings, and convert findings into engineering tasks.
          </p>
        </div>

        {/* Project Selector Control */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="workspace-project-select" className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Your Published Project
              </label>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Owner
              </span>
            </div>
            <div className="relative">
              <select
                id="workspace-project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full sm:w-64 appearance-none px-3.5 py-2 pr-9 text-xs font-semibold rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer shadow-2xs"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCategoryLabel(p.category)})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {selectedProject && (
            <div className="sm:self-end flex items-center gap-2">
              <Link to={`/projects/${selectedProject.id}`}>
                <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 h-[38px] border-[var(--border-default)] cursor-pointer">
                  <span>View Public Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Link to={`/personal/projects/${selectedProject.id}/setup`}>
                <Button variant="ghost" size="sm" className="text-xs font-semibold h-[38px] cursor-pointer text-[var(--text-muted)]" title="Settings & Ingestion">
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 2. Workspace Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3 overflow-x-auto text-xs font-bold no-scrollbar">
        <button
          type="button"
          onClick={() => setWorkspaceMode('assistant')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            workspaceMode === 'assistant'
              ? 'bg-[var(--accent)] text-white shadow-xs'
              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI Answering Assistant</span>
        </button>

        <button
          type="button"
          onClick={() => setWorkspaceMode('findings')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            workspaceMode === 'findings'
              ? 'bg-[var(--accent)] text-white shadow-xs'
              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Verified Findings & Tasks</span>
          {report?.findings && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              workspaceMode === 'findings' ? 'bg-white/20 text-white' : 'bg-blue-50 text-[var(--accent)]'
            }`}>
              {report.findings.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setWorkspaceMode('audio')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            workspaceMode === 'audio'
              ? 'bg-[var(--accent)] text-white shadow-xs'
              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)]'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-amber-500" />
          <span>Audio Deep Dive Podcast</span>
        </button>

        <button
          type="button"
          onClick={() => setWorkspaceMode('sources')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            workspaceMode === 'sources'
              ? 'bg-[var(--accent)] text-white shadow-xs'
              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Knowledge Sources ({sources.length})</span>
        </button>
      </div>

      {/* 3. Main Workspace Surface */}
      {selectedProject && (
        <div className="space-y-6">
          {/* Mode 1: AI Answering Assistant */}
          {workspaceMode === 'assistant' && (
            <div className="space-y-4">
              <ProjectChatTab project={selectedProject} />
            </div>
          )}

          {/* Mode 2: Verified Findings & Engineering Tasks Studio */}
          {workspaceMode === 'findings' && (
            <div className="space-y-6">
              {report ? (
                <div className="space-y-6">
                  {/* Top Stats Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-center shadow-xs">
                      <span className="text-xl font-bold text-[var(--text-primary)]">
                        {report.findings?.length || 0}
                      </span>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">Verified Findings</p>
                    </div>

                    <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-center shadow-xs">
                      <span className="text-xl font-bold text-red-600 dark:text-red-400">
                        {report.findings?.filter((f) => f.severity === 'high' || f.severity === 'blocker').length || 0}
                      </span>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">High Severity / Blockers</p>
                    </div>

                    <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-center shadow-xs">
                      <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {report.findings?.filter((f) => f.status === 'in_progress').length || 0}
                      </span>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">Tasks In Progress</p>
                    </div>

                    <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] text-center shadow-xs">
                      <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {report.findings?.filter((f) => f.status === 'addressed').length || 0}
                      </span>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">Resolved Tasks</p>
                    </div>
                  </div>

                  {/* Collapsible Executive Research Report Summary */}
                  {(report.executiveSummary || report.strengthsSummary) && (
                    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] overflow-hidden shadow-xs transition-all">
                      <button
                        type="button"
                        onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[var(--accent)] border border-blue-200/70 dark:border-blue-800/40 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                              Executive Product Intelligence Report
                            </h3>
                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                              {report.executiveSummary || 'Verified grounded synthesis across telemetry & documents.'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
                          <span>{isSummaryExpanded ? 'Collapse' : 'Expand'}</span>
                          {isSummaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {isSummaryExpanded && (
                        <div className="p-5 pt-0 border-t border-[var(--border-default)]/60 space-y-4 text-xs mt-3">
                          {report.executiveSummary && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                Executive Diagnostic
                              </span>
                              <p className="leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                                {report.executiveSummary}
                              </p>
                            </div>
                          )}

                          {report.strengthsSummary && (
                            <div className="space-y-1 pt-2 border-t border-[var(--border-default)]/60">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Validated Strengths & Core Advantages
                              </span>
                              <p className="leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                                {report.strengthsSummary}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Studio Action & Filter Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    {/* View Switcher & Category Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] p-0.5 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setFindingsView('kanban')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            findingsView === 'kanban'
                              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <Columns className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Kanban Tasks</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFindingsView('list')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            findingsView === 'list'
                              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <ListFilter className="w-3.5 h-3.5 text-sky-500" />
                          <span>Detailed List</span>
                        </button>
                      </div>

                      {/* Category Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {['all', 'high', 'ux', 'performance', 'architecture', 'security'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setFindingCategoryFilter(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                              findingCategoryFilter === cat
                                ? 'bg-[var(--accent)] text-white'
                                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
                            }`}
                          >
                            {cat === 'all' ? 'All Areas' : cat === 'high' ? 'High Severity' : cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Report Run & Export Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExportFindingsReport}
                        className="text-xs font-semibold gap-1.5 border-[var(--border-default)] cursor-pointer"
                        title="Copy Markdown Report to clipboard"
                      >
                        {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Download className="w-3.5 h-3.5" />}
                        <span>{copiedExport ? 'Copied' : 'Export'}</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={handleRunAIReview}
                        disabled={isGeneratingReport}
                        className="text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingReport ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingReport ? 'Analyzing...' : 'Run Fresh Review'}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Kanban Task Pipeline View */}
                  {findingsView === 'kanban' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Column 1: Identified / Open */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                              Identified / Backlog
                            </h4>
                          </div>
                          <span className="text-[11px] font-bold text-[var(--text-muted)] px-2 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-default)]">
                            {
                              (report.findings || [])
                                .filter((f) => (findingCategoryFilter === 'all' ? true : findingCategoryFilter === 'high' ? f.severity === 'high' || f.severity === 'blocker' : f.category === findingCategoryFilter))
                                .filter((f) => f.status === 'open' || !f.status).length
                            }
                          </span>
                        </div>

                        <div className="space-y-3">
                          {(report.findings || [])
                            .filter((f) => (findingCategoryFilter === 'all' ? true : findingCategoryFilter === 'high' ? f.severity === 'high' || f.severity === 'blocker' : f.category === findingCategoryFilter))
                            .filter((f) => f.status === 'open' || !f.status)
                            .map((f) => (
                              <div
                                key={f.id}
                                className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/50 transition-all space-y-3 shadow-xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                      f.severity === 'high' || f.severity === 'blocker'
                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                        : f.severity === 'medium'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    }`}
                                  >
                                    {f.severity}
                                  </span>
                                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                                    {f.category}
                                  </span>
                                </div>

                                <h5 className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                                  {f.title || f.observation}
                                </h5>

                                {/* Evidence Quote */}
                                {(f.evidenceQuote || f.citations?.[0]?.canonicalQuote) && (
                                  <div className="p-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] italic leading-relaxed">
                                    <span className="not-italic font-bold text-[var(--accent)] mr-1">“Evidence:”</span>
                                    {f.evidenceQuote || f.citations?.[0]?.canonicalQuote}
                                  </div>
                                )}

                                {/* Recommendation */}
                                {f.recommendation && (
                                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                                    <strong className="text-[var(--text-primary)]">Fix: </strong>
                                    {f.recommendation}
                                  </p>
                                )}

                                {/* Action Buttons */}
                                <div className="pt-2 border-t border-[var(--border-default)]/60 flex items-center justify-between text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedFindingForEvidence(f)}
                                    className="text-[var(--accent)] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    <span>{f.citations?.length || 1} Evidence Citations</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateFindingStatus(f.id, 'in_progress')}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[var(--accent)] border border-blue-200/70 dark:border-blue-800/40 font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                                  >
                                    Start Work →
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Column 2: In Progress */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                            <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                              In Progress
                            </h4>
                          </div>
                          <span className="text-[11px] font-bold text-[var(--text-muted)] px-2 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-default)]">
                            {
                              (report.findings || [])
                                .filter((f) => (findingCategoryFilter === 'all' ? true : findingCategoryFilter === 'high' ? f.severity === 'high' || f.severity === 'blocker' : f.category === findingCategoryFilter))
                                .filter((f) => f.status === 'in_progress').length
                            }
                          </span>
                        </div>

                        <div className="space-y-3">
                          {(report.findings || [])
                            .filter((f) => (findingCategoryFilter === 'all' ? true : findingCategoryFilter === 'high' ? f.severity === 'high' || f.severity === 'blocker' : f.category === findingCategoryFilter))
                            .filter((f) => f.status === 'in_progress')
                            .map((f) => (
                              <div
                                key={f.id}
                                className="p-4 rounded-2xl border border-amber-500/30 bg-[var(--surface)] hover:border-amber-500/50 transition-all space-y-3 shadow-xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                      f.severity === 'high' || f.severity === 'blocker'
                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                        : f.severity === 'medium'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    }`}
                                  >
                                    {f.severity}
                                  </span>
                                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                                    {f.category}
                                  </span>
                                </div>

                                <h5 className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                                  {f.title || f.observation}
                                </h5>

                                {(f.evidenceQuote || f.citations?.[0]?.canonicalQuote) && (
                                  <div className="p-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] italic leading-relaxed">
                                    <span className="not-italic font-bold text-[var(--accent)] mr-1">“Evidence:”</span>
                                    {f.evidenceQuote || f.citations?.[0]?.canonicalQuote}
                                  </div>
                                )}

                                {f.recommendation && (
                                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                                    <strong className="text-[var(--text-primary)]">Fix: </strong>
                                    {f.recommendation}
                                  </p>
                                )}

                                <div className="pt-2 border-t border-[var(--border-default)]/60 flex items-center justify-between text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateFindingStatus(f.id, 'open')}
                                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-semibold cursor-pointer"
                                  >
                                    ← Backlog
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateFindingStatus(f.id, 'addressed')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                  >
                                    Mark Resolved ✓
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Column 3: Addressed / Resolved */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                              Resolved / Addressed
                            </h4>
                          </div>
                          <span className="text-[11px] font-bold text-[var(--text-muted)] px-2 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-default)]">
                            {
                              (report.findings || [])
                                .filter((f) => (findingCategoryFilter === 'all' ? true : findingCategoryFilter === 'high' ? f.severity === 'high' || f.severity === 'blocker' : f.category === findingCategoryFilter))
                                .filter((f) => f.status === 'addressed').length
                            }
                          </span>
                        </div>

                        <div className="space-y-3">
                          {(report.findings || [])
                            .filter((f) => (findingCategoryFilter === 'all' ? true : findingCategoryFilter === 'high' ? f.severity === 'high' || f.severity === 'blocker' : f.category === findingCategoryFilter))
                            .filter((f) => f.status === 'addressed')
                            .map((f) => (
                              <div
                                key={f.id}
                                className="p-4 rounded-2xl border border-emerald-500/30 bg-[var(--surface)]/70 hover:border-emerald-500/50 transition-all space-y-3 shadow-xs opacity-90"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    Resolved
                                  </span>
                                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                                    {f.category}
                                  </span>
                                </div>

                                <h5 className="text-xs font-bold text-[var(--text-primary)] leading-snug line-through opacity-80">
                                  {f.title || f.observation}
                                </h5>

                                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                                  {f.recommendation || f.observation}
                                </p>

                                <div className="pt-2 border-t border-[var(--border-default)]/60 flex items-center justify-between text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedFindingForEvidence(f)}
                                    className="text-[var(--accent)] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    <span>Citations</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateFindingStatus(f.id, 'open')}
                                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-semibold cursor-pointer"
                                  >
                                    Reopen
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Detailed List View */
                    <div className="space-y-3">
                      {(report.findings || [])
                        .filter((f) => (findingCategoryFilter === 'all' ? true : findingCategoryFilter === 'high' ? f.severity === 'high' || f.severity === 'blocker' : f.category === findingCategoryFilter))
                        .map((f) => (
                          <div
                            key={f.id}
                            className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/40 transition-all space-y-3 shadow-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    f.severity === 'high' || f.severity === 'blocker'
                                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                      : f.severity === 'medium'
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  }`}
                                >
                                  {f.severity}
                                </span>
                                <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                                  {f.category}
                                </span>
                                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                                  {f.title || f.observation}
                                </h4>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <select
                                  value={f.status || 'open'}
                                  onChange={(e) => handleUpdateFindingStatus(f.id, e.target.value as any)}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] cursor-pointer"
                                >
                                  <option value="open">Identified / Open</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="addressed">Resolved / Addressed</option>
                                </select>
                              </div>
                            </div>

                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                              {f.observation}
                            </p>

                            {(f.evidenceQuote || f.citations?.[0]?.canonicalQuote) && (
                              <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] italic leading-relaxed">
                                <span className="not-italic font-bold text-[var(--accent)] mr-1">“Ground Truth Evidence:”</span>
                                {f.evidenceQuote || f.citations?.[0]?.canonicalQuote}
                              </div>
                            )}

                            {f.recommendation && (
                              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-[var(--text-primary)]">
                                <span className="font-semibold text-[var(--accent)]">Recommended Action: </span>
                                {f.recommendation}
                              </div>
                            )}

                            <div className="pt-2 border-t border-[var(--border-default)]/60 flex items-center justify-between text-xs">
                              <button
                                type="button"
                                onClick={() => setSelectedFindingForEvidence(f)}
                                className="text-[var(--accent)] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Inspect {f.citations?.length || 1} Grounded Citations</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center rounded-3xl border border-dashed border-[var(--border-default)] bg-[var(--surface)] space-y-4 shadow-xs">
                  <ShieldCheck className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-60" />
                  <div className="space-y-1">
                    <p className="text-base font-bold text-[var(--text-primary)]">
                      No Findings Report Generated Yet
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                      Trigger an AI review to generate verified findings, extract grounded evidence citations, and populate your engineering tasks board.
                    </p>
                  </div>
                  <Button
                    onClick={handleRunAIReview}
                    disabled={isGeneratingReport}
                    className="text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingReport ? 'Synthesizing Intelligence...' : 'Run AI Feedback Review'}</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Finding Evidence Detail Modal */}
          {selectedFindingForEvidence && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="w-full max-w-lg bg-[var(--surface)] rounded-2xl border border-[var(--border-default)] shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[var(--accent)]" />
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      Grounded Citations & Evidence
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFindingForEvidence(null)}
                    className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Finding Title
                    </span>
                    <h5 className="font-bold text-[var(--text-primary)] mt-0.5">
                      {selectedFindingForEvidence.title || selectedFindingForEvidence.category}
                    </h5>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Direct Telemetry / Feedback Quotes
                    </span>
                    <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] italic leading-relaxed text-[var(--text-secondary)]">
                      "{selectedFindingForEvidence.evidenceQuote || selectedFindingForEvidence.citations?.[0]?.canonicalQuote || 'Direct user telemetry evidence'}"
                    </div>
                  </div>

                  {selectedFindingForEvidence.citations && selectedFindingForEvidence.citations.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[var(--border-default)]/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Indexed Citations ({selectedFindingForEvidence.citations.length})
                      </span>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {selectedFindingForEvidence.citations.map((c: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-[var(--accent)] font-semibold">
                              <span>Source: {c.sourceName || c.source_name || 'Community Telemetry'}</span>
                              {c.pageNumber && <span>Page {c.pageNumber}</span>}
                            </div>
                            <p className="italic text-[var(--text-secondary)]">"{c.canonicalQuote || c.cleanQuote || c.quote}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Status: <strong className="capitalize text-[var(--text-primary)]">{selectedFindingForEvidence.status || 'open'}</strong>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFindingForEvidence(null)}
                      className="text-xs cursor-pointer"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode 3: Audio Deep Dive Podcast */}
          {workspaceMode === 'audio' && (
            <div className="p-6 sm:p-8 rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider">
                    <Radio className="w-4 h-4" />
                    <span>Synthetic Dialogue Briefing</span>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    Two-Host Conversational Audio Deep Dive
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Synthesizes feedback, telemetry friction, and architectural recommendations into an interactive podcast.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={togglePlayAudio}
                    className="flex items-center gap-2 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause Briefing</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Play Audio Briefing</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={resetAudio}
                    className="text-xs font-semibold border-[var(--border-default)] cursor-pointer"
                    title="Reset to beginning"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Interactive Script Teleprompter */}
              <div className="space-y-3 pt-4 border-t border-[var(--border-default)]/60">
                {podcastScript.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      currentAudioIndex === idx && isPlayingAudio
                        ? 'border-[var(--accent)] bg-blue-50/50 shadow-xs ring-2 ring-[var(--accent)]/20'
                        : 'border-[var(--border-default)] bg-[var(--surface-raised)]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        item.host === 'Alex'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        Host: {item.host}
                      </span>
                      {currentAudioIndex === idx && isPlayingAudio && (
                        <span className="text-[10px] font-semibold text-[var(--accent)] animate-pulse">
                          Speaking now...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode 4: Knowledge Sources Inspector */}
          {workspaceMode === 'sources' && (
            <div className="p-6 sm:p-8 rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    Ingested Knowledge Sources
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Documents, architecture specs, and PRD documents indexed into RAG embeddings for {selectedProject.name}.
                  </p>
                </div>

                <Link to={`/personal/projects/${selectedProject.id}/setup`}>
                  <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-[var(--border-default)] cursor-pointer">
                    <span>Manage & Upload Sources</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="pt-2">
                {sources.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface-raised)] text-xs text-[var(--text-muted)] space-y-2">
                    <FileText className="w-8 h-8 mx-auto opacity-50 text-[var(--text-muted)]" />
                    <p className="font-semibold text-[var(--text-primary)]">No external source documents attached yet</p>
                    <p>Using public community discussion for RAG retrieval and Q&A grounding.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sources.map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-[var(--accent)] shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text-primary)] truncate">
                              {s.name || s.originalFilename}
                            </p>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              {s.mimeType} • {s.fileSize ? `${Math.round(s.fileSize / 1024)} KB` : 'Text'}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Indexed
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
