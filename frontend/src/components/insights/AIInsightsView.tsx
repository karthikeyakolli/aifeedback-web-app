import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Lock,
  Send,
  CheckCircle2,
  ArrowRight,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import type {
  ProductReview,
  ReviewSourceAvailability,
  GenerateReviewRequest,
  ChatMessage,
  Citation,
  Comment,
} from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { NotebookSourcesRail } from './NotebookSourcesRail';
import { NotebookStudioRail } from './NotebookStudioRail';
import { ChatGPTMessage } from './ChatGPTMessage';

interface AIInsightsViewProps {
  postId: string;
  postAuthorId?: string;
  initialAnalysis?: any;
  onJumpToComment?: (commentId: string) => void;
}

type AgentMode = 'analytical' | 'professional' | 'visual' | 'explorer';
type MobileWorkspaceTab = 'sources' | 'chat' | 'studio';

const PIPELINE_STAGES = [
  '1. Verifying creator authorization',
  '2. Collecting eligible comments & specifications',
  '3. Retrieving evidence & chunking documents',
  '4. Preparing context & source snapshot',
  '5. Generating structured 13-section review',
  '6. Validating citations & deterministic metrics',
  '7. Persisting immutable review & linking conversation',
];

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  postId,
  postAuthorId,
  onJumpToComment,
}) => {
  const { user, isAuthenticated } = useAuth();
  const isOwner = isAuthenticated && user && postAuthorId && user.id === postAuthorId;

  // Workspace layout state (NotebookLM 3-column architecture)
  const [isSourcesCollapsed, setIsSourcesCollapsed] = useState(false);
  const [isStudioCollapsed, setIsStudioCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileWorkspaceTab>('chat');
  const [agentMode, setAgentMode] = useState<AgentMode>('analytical');

  // Review & Source Availability State
  const [sourceAvailability, setSourceAvailability] = useState<ReviewSourceAvailability | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reviewsList, setReviewsList] = useState<ProductReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Generation Controls
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState<'both' | 'community' | 'documents'>('both');
  const [includeCommunity, setIncludeCommunity] = useState(true);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Review-Linked Chat State (ChatGPT style)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Citation & Source Inspector State
  const [inspectedCitation, setInspectedCitation] = useState<Citation | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState<'md' | 'pdf' | null>(null);

  // Initial Load: Fetch source availability, comments, and reviews list (NO AI CALLS)
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      if (!isOwner) {
        setIsLoadingInitial(false);
        return;
      }

      setIsLoadingInitial(true);
      setFetchError(null);

      try {
        const [sources, commentsData, reviews] = await Promise.all([
          api.getReviewSources(postId).catch((err) => {
            console.error('Error fetching review sources:', err);
            return null;
          }),
          api.getComments(postId).catch((err) => {
            console.error('Error fetching comments:', err);
            return [];
          }),
          api.listProductReviews(postId).catch((err) => {
            console.error('Error fetching reviews list:', err);
            return [];
          }),
        ]);

        if (!isMounted) return;

        if (sources) {
          setSourceAvailability(sources);
          setSelectedDocIds(sources.documents.map((d) => d.id));
        }

        if (commentsData) {
          setComments(commentsData);
        }

        if (reviews && reviews.length > 0) {
          setReviewsList(reviews);
          const latest = reviews[reviews.length - 1];
          setSelectedReview(latest);
        }
      } catch (err: any) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to initialize AI Research Lab.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [postId, isOwner]);

  // Load Review-Linked Conversation whenever selected review changes
  useEffect(() => {
    if (!selectedReview) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingChat(true);

    api
      .getReviewConversation(selectedReview.id)
      .then((data) => {
        if (isMounted) {
          setMessages(data.messages || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load review conversation:', err);
        if (isMounted) {
          setMessages([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingChat(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedReview?.id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSendingMessage]);

  // Handle Full Product Review Generation
  const handleTriggerReview = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setShowConfigModal(false);

    // Simulate progress through the 7 real processing stages
    let currentStage = 0;
    setGenerationStage(0);
    const interval = setInterval(() => {
      currentStage += 1;
      if (currentStage < PIPELINE_STAGES.length) {
        setGenerationStage(currentStage);
      }
    }, 1200);

    try {
      const payload: GenerateReviewRequest = {
        sourceType: selectedSourceType,
        includeCommunity: includeCommunity,
        includedDocIds: selectedSourceType === 'community' ? [] : selectedDocIds,
      };

      const newReview = await api.generateProductReview(postId, payload);
      clearInterval(interval);
      setGenerationStage(PIPELINE_STAGES.length - 1);

      // Refresh reviews list and select new review
      const updatedList = await api.listProductReviews(postId);
      setReviewsList(updatedList);
      setSelectedReview(newReview);

      // Refresh source availability indicator
      const updatedSources = await api.getReviewSources(postId);
      setSourceAvailability(updatedSources);

      // Open studio panel if collapsed
      setIsStudioCollapsed(false);
    } catch (err: any) {
      clearInterval(interval);
      setGenerationError(err.message || 'Review generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Send Review-Linked Question
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !selectedReview || isSendingMessage) return;

    const questionText = chatInput.trim();
    setChatInput('');
    setIsSendingMessage(true);
    setChatError(null);

    // Optimistically append user message
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      sessionId: selectedReview.linkedSessionId || '',
      role: 'user',
      content: questionText,
      citations: [],
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const assistantMsg = await api.sendReviewMessage(selectedReview.id, {
        question: questionText,
        agentMode: agentMode,
      });

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        tempUserMsg,
        assistantMsg,
      ]);
    } catch (err: any) {
      setChatError(err.message || 'Failed to deliver response. Please try again.');
    } finally {
      setIsSendingMessage(false);
      chatInputRef.current?.focus();
    }
  };

  // Export handler
  const handleExport = async (format: 'md' | 'pdf') => {
    if (!selectedReview) return;
    setIsExporting(format);
    try {
      const blob = await api.downloadProductReview(selectedReview.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product_review_v${selectedReview.version}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(null);
    }
  };

  // Guard: Unauthorized visitor
  if (!isOwner) {
    return (
      <Card className="p-8 text-center max-w-2xl mx-auto my-8 border-dashed border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
        <Lock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
          Owner-Only Research Studio
        </h3>
        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-4">
          NotebookLM workspace synthesis, Full Product Reviews, and private document research are strictly confidential to the verified project owner.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
          <Badge variant="outline" className="border-[var(--border-subtle)]">
            Verified Owner Security Boundary
          </Badge>
          <span>•</span>
          <span>HTTP 403 Enforced</span>
        </div>
      </Card>
    );
  }

  // Loading initial DB source state
  if (isLoadingInitial) {
    return (
      <div className="p-16 text-center space-y-3">
        <RefreshCw className="w-7 h-7 animate-spin text-indigo-500 mx-auto" />
        <p className="text-xs font-medium text-[var(--text-muted)]">
          Loading NotebookLM Studio & workspace sources...
        </p>
      </div>
    );
  }

  // Error fetching state
  if (fetchError) {
    return (
      <Card className="p-6 border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-3">{fetchError}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Card>
    );
  }

  const activeDocCount = selectedDocIds.length;
  const activeSourcesCount =
    activeDocCount + (includeCommunity && comments.length > 0 ? 1 : 0);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[640px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden shadow-sm">
      {/* Top Workspace Header (NotebookLM Style) */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]/60 text-xs">
        {/* Left: Product title & Model */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-bold text-[var(--text-primary)] tracking-tight">
              NotebookLM Research Studio
            </h2>
          </div>

          <span className="text-[var(--text-muted)] hidden sm:inline">|</span>

          {/* Model Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-semibold border border-indigo-500/20">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Gemini 3.8 Flash + Groq Hybrid</span>
          </div>

          {/* Review Version Tag */}
          {selectedReview && (
            <Badge variant="outline" className="hidden md:inline-flex text-[10px] font-mono border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              Review V{selectedReview.version} Active
            </Badge>
          )}
        </div>

        {/* Center: Mobile View Switcher (Sources | Chat | Studio) */}
        <div className="flex sm:hidden items-center p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-[11px]">
          <button
            type="button"
            onClick={() => setMobileTab('sources')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              mobileTab === 'sources'
                ? 'bg-indigo-600 text-white'
                : 'text-[var(--text-muted)]'
            }`}
          >
            Sources
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              mobileTab === 'chat'
                ? 'bg-indigo-600 text-white'
                : 'text-[var(--text-muted)]'
            }`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('studio')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              mobileTab === 'studio'
                ? 'bg-indigo-600 text-white'
                : 'text-[var(--text-muted)]'
            }`}
          >
            Studio
          </button>
        </div>

        {/* Right: Layout Toggle Actions */}
        <div className="hidden sm:flex items-center gap-1.5">
          {/* Toggle Sources Rail */}
          <button
            type="button"
            onClick={() => setIsSourcesCollapsed(!isSourcesCollapsed)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
              !isSourcesCollapsed
                ? 'bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-primary)] shadow-2xs'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle Sources Rail"
          >
            {isSourcesCollapsed ? (
              <PanelLeftOpen className="w-3.5 h-3.5 text-indigo-500" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5" />
            )}
            <span>Sources</span>
          </button>

          {/* Toggle Studio Rail */}
          <button
            type="button"
            onClick={() => setIsStudioCollapsed(!isStudioCollapsed)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
              !isStudioCollapsed
                ? 'bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-primary)] shadow-2xs'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle Studio Rail"
          >
            <span>Studio</span>
            {isStudioCollapsed ? (
              <PanelRightOpen className="w-3.5 h-3.5 text-indigo-500" />
            ) : (
              <PanelRightClose className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main 3-Column Split Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PANEL 1: Left Sources Rail (NotebookLM Style) */}
        <div
          className={`${
            mobileTab === 'sources' ? 'flex w-full absolute inset-0 z-20' : 'hidden sm:flex'
          }`}
        >
          <NotebookSourcesRail
            documents={sourceAvailability?.documents || []}
            comments={comments}
            selectedDocIds={selectedDocIds}
            onToggleDocId={(docId) => {
              setSelectedDocIds((prev) =>
                prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
              );
            }}
            onSelectAllDocs={(selectAll) => {
              if (selectAll && sourceAvailability) {
                setSelectedDocIds(sourceAvailability.documents.map((d) => d.id));
              } else {
                setSelectedDocIds([]);
              }
            }}
            includeCommunity={includeCommunity}
            onToggleIncludeCommunity={() => setIncludeCommunity(!includeCommunity)}
            onInspectSource={(source) => {
              if (source.type === 'comment') {
                setInspectedCitation({
                  commentId: source.data.id,
                  quoteSnippet: source.data.content,
                  authorDisplay: source.data.author.displayName || source.data.author.username,
                  sourceType: 'comment',
                });
              } else {
                setInspectedCitation({
                  commentId: source.data.id,
                  quoteSnippet: source.data.excerpt || source.data.filename,
                  authorDisplay: 'Specification Document',
                  sourceType: 'document',
                  filename: source.data.filename,
                });
              }
              setIsStudioCollapsed(false);
              setMobileTab('studio');
            }}
            isCollapsed={isSourcesCollapsed}
            onToggleCollapse={() => setIsSourcesCollapsed(!isSourcesCollapsed)}
            hasNewActivity={sourceAvailability?.hasNewActivitySinceLastReview}
            newActivityText={
              sourceAvailability?.newCommentsCountSinceLastReview
                ? `⚡ ${sourceAvailability.newCommentsCountSinceLastReview} new comments`
                : undefined
            }
            onOpenUploadModal={() => setShowConfigModal(true)}
          />
        </div>

        {/* PANEL 2: Center Conversation Canvas (ChatGPT Experience) */}
        <div
          className={`flex-1 flex flex-col h-full bg-[var(--surface)] overflow-hidden ${
            mobileTab === 'chat' ? 'flex' : 'hidden sm:flex'
          }`}
        >
          {/* Canvas Sub-Header: Mode Selector & Grounding Status */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)]/70 text-xs bg-[var(--surface)]">
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              <span className="text-[11px] text-[var(--text-muted)] font-medium mr-1 hidden md:inline">
                Style:
              </span>
              {(['analytical', 'professional', 'visual', 'explorer'] as AgentMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAgentMode(mode)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer capitalize ${
                    agentMode === mode
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {mode === 'visual' ? 'Architecture' : mode}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                {activeSourcesCount} sources active
              </span>
            </div>
          </div>

          {/* Conversation Stream Feed */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {isLoadingChat ? (
              <div className="py-20 text-center space-y-2 text-xs text-[var(--text-muted)] animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                <p>Retrieving grounded conversation for Review V{selectedReview?.version}...</p>
              </div>
            ) : messages.length === 0 ? (
              /* Welcome Canvas (NotebookLM + ChatGPT style) */
              <div className="max-w-xl mx-auto py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs border border-indigo-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Ask Anything About Your Product & Supporting Sources
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
                  Every answer is strictly grounded in your active Review V{selectedReview?.version || 1}{' '}
                  findings, verified customer comments, and internal specifications.
                </p>

                {/* Quick Starter Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-3">
                  {[
                    {
                      label: 'Explain top customer friction points',
                      desc: 'Deep-dive into verified pain points and root causes',
                    },
                    {
                      label: 'Compare feedback with PRD specs',
                      desc: 'Identify discrepancies between roadmap and user requests',
                    },
                    {
                      label: 'Suggest P0 feature improvements',
                      desc: 'Generate immediate actionable roadmap deliverables',
                    },
                    {
                      label: 'What evidence is missing?',
                      desc: 'Examine feedback gaps and unaddressed customer questions',
                    },
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setChatInput(s.label)}
                      className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/60 hover:bg-[var(--surface-subtle)] hover:border-indigo-500/50 transition-all text-xs text-left cursor-pointer group shadow-2xs"
                    >
                      <div className="font-semibold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-between">
                        <span>{s.label}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message List */
              messages.map((m) => (
                <ChatGPTMessage
                  key={m.id}
                  message={m}
                  onCitationClick={(citation) => {
                    if (typeof citation === 'string') {
                      setInspectedCitation({
                        commentId: citation,
                        quoteSnippet: `Reference: ${citation}`,
                        authorDisplay: citation,
                        sourceType: 'comment',
                      });
                    } else {
                      setInspectedCitation(citation);
                    }
                    setIsStudioCollapsed(false);
                    setMobileTab('studio');
                  }}
                  onOpenSources={() => {
                    setIsSourcesCollapsed(false);
                    setMobileTab('sources');
                  }}
                />
              ))
            )}

            {/* In-Flight Thinking Indicator (ChatGPT style) */}
            {isSendingMessage && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] max-w-sm text-xs text-[var(--text-muted)] animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
                <span>Grounding answer in sources & synthesizing response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Docked Input Bar (ChatGPT Style) */}
          <div className="p-3 sm:p-4 border-t border-[var(--border-subtle)] bg-[var(--surface)] space-y-2">
            {/* Shortcut Chips Carousel */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {[
                'Explain top customer pain point',
                'Compare feedback with PRD specs',
                'Draft prioritized feature roadmap',
                'What critical features are missing?',
              ].map((shortcut) => (
                <button
                  key={shortcut}
                  type="button"
                  onClick={() => setChatInput(shortcut)}
                  className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-indigo-500 shrink-0 transition-colors cursor-pointer"
                >
                  {shortcut}
                </button>
              ))}
            </div>

            {/* Chat Error Notice */}
            {chatError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {chatError}
              </div>
            )}

            {/* Input Composer Card */}
            <form
              onSubmit={handleSendMessage}
              className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] focus-within:border-indigo-500 focus-within:bg-[var(--surface)] shadow-xs transition-all"
            >
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder="Ask anything about your product, review findings or supporting evidence..."
                disabled={isSendingMessage || !selectedReview}
                className="w-full text-xs sm:text-[13px] px-3.5 pt-3 pb-8 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none focus:outline-none"
              />

              {/* Bottom bar inside composer */}
              <div className="absolute left-3 right-3 bottom-2 flex items-center justify-between pointer-events-none">
                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                  {selectedReview
                    ? `Grounded in Review V${selectedReview.version}`
                    : 'No review active'}
                </span>

                <button
                  type="submit"
                  disabled={!chatInput.trim() || isSendingMessage || !selectedReview}
                  className="pointer-events-auto p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white transition-all cursor-pointer shadow-xs"
                  title="Send Question (Enter)"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* PANEL 3: Right Studio Rail (NotebookLM Studio Guide & 13-Section Review) */}
        <div
          className={`${
            mobileTab === 'studio' ? 'flex w-full absolute inset-0 z-20' : 'hidden sm:flex'
          }`}
        >
          <NotebookStudioRail
            selectedReview={selectedReview}
            reviewsList={reviewsList}
            onSelectReview={(review) => setSelectedReview(review)}
            onTriggerNewReview={() => setShowConfigModal(true)}
            onExport={handleExport}
            isExporting={isExporting}
            isCollapsed={isStudioCollapsed}
            onToggleCollapse={() => setIsStudioCollapsed(!isStudioCollapsed)}
            hasNewActivity={sourceAvailability?.hasNewActivitySinceLastReview}
            newActivityText={
              sourceAvailability?.newCommentsCountSinceLastReview
                ? `⚡ ${sourceAvailability.newCommentsCountSinceLastReview} new comments`
                : undefined
            }
            inspectedCitation={inspectedCitation}
            onCloseInspectedCitation={() => setInspectedCitation(null)}
            onJumpToComment={onJumpToComment}
          />
        </div>
      </div>

      {/* Generation Progress Indicator Modal */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 space-y-4 bg-[var(--surface)] border border-indigo-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Executing 7-Stage Full Product Review Pipeline
              </h4>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Synthesizing all eligible community feedback, replies, and specification documents...
            </p>
            <div className="space-y-2 text-xs pt-1">
              {PIPELINE_STAGES.map((stage, idx) => (
                <div key={stage} className="flex items-center gap-2">
                  {idx < generationStage ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : idx === generationStage ? (
                    <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[var(--border-subtle)] shrink-0" />
                  )}
                  <span
                    className={
                      idx <= generationStage
                        ? 'font-medium text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)]'
                    }
                  >
                    {stage}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Generation Error Banner */}
      {generationError && (
        <div className="p-3 border-t border-rose-500/30 bg-rose-500/10 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{generationError}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setGenerationError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Pre-generation Source Availability Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 space-y-4 bg-[var(--surface)] border border-[var(--border-subtle)] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Configure Review Sources
                </h4>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Choose which source categories to include in the synthesized review. Excluded sources
              will not be retrieved or cited.
            </p>

            {/* Source Type Filter */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-[var(--text-primary)]">Source Selection:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'both', label: 'All Sources' },
                  { id: 'community', label: 'Community' },
                  { id: 'documents', label: 'Documents' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedSourceType(type.id as any)}
                    className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                      selectedSourceType === type.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Checklist */}
            {selectedSourceType !== 'community' &&
              sourceAvailability &&
              sourceAvailability.documents.length > 0 && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--text-primary)]">
                      Included Documents ({selectedDocIds.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedDocIds.length === sourceAvailability.documents.length) {
                          setSelectedDocIds([]);
                        } else {
                          setSelectedDocIds(sourceAvailability.documents.map((d) => d.id));
                        }
                      }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium"
                    >
                      {selectedDocIds.length === sourceAvailability.documents.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                    {sourceAvailability.documents.map((doc) => (
                      <label
                        key={doc.id}
                        className="flex items-center gap-2 p-1 rounded hover:bg-[var(--surface)] cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocIds.includes(doc.id)}
                          onChange={() => {
                            setSelectedDocIds((prev) =>
                              prev.includes(doc.id)
                                ? prev.filter((id) => id !== doc.id)
                                : [...prev, doc.id]
                            );
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate text-[var(--text-primary)] font-medium">
                          {doc.filename}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase ml-auto font-mono">
                          {doc.fileType}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <Button size="sm" variant="ghost" onClick={() => setShowConfigModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleTriggerReview}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Generate Review V{(selectedReview?.version || reviewsList.length) + 1}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
