import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Lightbulb,
  Bug,
  FileCheck2,
  Plus,
  Globe,
  MessageSquare,
  FileText,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Layers,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Project, ProjectChat, ProjectChatMessage } from '../../types';
import { Button } from '../common/Button';
import { cn, formatTimeAgo } from '../../lib/utils';

interface ProjectChatTabProps {
  project: Project | any;
}

const PRESET_QUERIES = [
  {
    id: 'complaints',
    label: 'Community Reviews & Friction',
    icon: Bug,
    query: 'What are the most frequent customer complaints and reviews regarding bugs or UX friction?',
  },
  {
    id: 'standards',
    label: 'Online Standards Benchmark',
    icon: Globe,
    query: 'How does our architecture compare against modern OWASP security and Web Vitals standards online?',
  },
  {
    id: 'requests',
    label: 'Requested Improvements',
    icon: Lightbulb,
    query: 'What specific improvements or features are users actively requesting in feedback?',
  },
  {
    id: 'prd',
    label: 'PRD vs Feedback Audit',
    icon: FileCheck2,
    query: 'Compare the internal project specifications against actual community reviews and online best practices.',
  },
];

export const ProjectChatTab: React.FC<ProjectChatTabProps> = ({ project }) => {
  const { isAuthenticated, openAuthModal } = useAuth();

  // State
  const [chats, setChats] = useState<ProjectChat[]>([]);
  const [activeChat, setActiveChat] = useState<ProjectChat | null>(null);
  const [messages, setMessages] = useState<ProjectChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCitation, setSelectedCitation] = useState<any | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Layout State
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [creatingChat, setCreatingChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async (selectChatId?: string) => {
    if (!project?.id) return;
    setIsLoading(true);
    setErrorMessage(null);

    // If not authenticated, provide friendly guest state
    if (!isAuthenticated) {
      setIsLoading(false);
      setMessages([
        {
          id: 'demo_welcome',
          chatId: 'demo',
          role: 'assistant',
          content: `Welcome to the ${project.name} AI Research Workspace ("The Other Side"). I am equipped with an Online Sources Brain and multi-layer grounding across internal specifications, community user reviews, and online standards. Sign in to start custom research sessions, explore live citations, and audit architecture.`,
          citations: [
            {
              sourceName: `${project.name} Specification`,
              cleanQuote: project.tagline || project.description || 'Verified project documentation',
              relevancePercentage: 98,
              sourceType: 'project_spec',
            },
            {
              sourceName: 'OWASP & Web Standards Benchmark',
              cleanQuote: 'RFC & API security standards verified via online intelligence engine.',
              relevancePercentage: 92,
              sourceType: 'online_source',
              url: 'https://owasp.org',
            },
          ],
          classification: 'general',
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    try {
      const list = await api.listProjectChats(project.id);
      setChats(list);

      if (list.length > 0) {
        const targetId = selectChatId || list[0].id;
        const fullChat = await api.getProjectChat(project.id, targetId);
        setActiveChat(fullChat);
        setMessages(fullChat.messages || []);
      } else {
        // Create initial project discussion chat
        const created = await api.createProjectChat(
          project.id,
          `${project.name} Technical & Community Research`,
          'project_wide'
        );
        setChats([created]);
        setActiveChat(created);
        setMessages(created.messages || []);
      }
    } catch (err: any) {
      console.warn('Failed to load project chats:', err);
      setErrorMessage(err.message || 'Unable to load project chat sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, [project.id, isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Switch chat session
  const handleSelectChat = async (chat: ProjectChat) => {
    if (activeChat?.id === chat.id) return;
    setIsLoading(true);
    try {
      const fullChat = await api.getProjectChat(project.id, chat.id);
      setActiveChat(fullChat);
      setMessages(fullChat.messages || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to switch chat session.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new research session
  const handleCreateNewChat = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const sessionNum = chats.length + 1;
    const title = `Research Session #${sessionNum} - ${new Date().toLocaleDateString()}`;

    setCreatingChat(true);
    try {
      const created = await api.createProjectChat(project.id, title, 'project_wide');
      setChats((prev) => [created, ...prev]);
      setActiveChat(created);
      setMessages(created.messages || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create new research session.');
    } finally {
      setCreatingChat(false);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputContent).trim();
    if (!text || isSending) return;

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (!activeChat) {
      try {
        const created = await api.createProjectChat(
          project.id,
          `${project.name} Technical Research`,
          'project_wide'
        );
        setActiveChat(created);
      } catch (e: any) {
        setErrorMessage(e.message || 'Could not start chat session.');
        return;
      }
    }

    setInputContent('');
    setIsSending(true);

    const tempUserMsg: ProjectChatMessage = {
      id: `temp_${Date.now()}`,
      chatId: activeChat ? activeChat.id : 'temp',
      role: 'user',
      content: text,
      citations: [],
      classification: 'question',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const assistantMsg = await api.sendProjectChatMessage(
        project.id,
        activeChat ? activeChat.id : 'main',
        text
      );
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to synthesize assistant response.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessageToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  const getClassificationBadge = (cls: string) => {
    const map: Record<string, { label: string; color: string }> = {
      decision: { label: 'Decision', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
      question: { label: 'Question', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
      suggestion: { label: 'Suggestion', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
      bug: { label: 'Bug / Defect', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
      requirement: { label: 'Requirement', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
      clarification: { label: 'Clarification', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
      code_generation: { label: 'Code Solution', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
      general: { label: 'General', color: 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border-default)]' },
    };
    const c = map[cls] || map.general;
    return (
      <span className={cn('px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold uppercase border', c.color)}>
        {c.label}
      </span>
    );
  };

  const filteredMessages = selectedCategory === 'all'
    ? messages
    : messages.filter((m) => m.classification === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Inquiries' },
    { id: 'question', label: 'Questions' },
    { id: 'bug', label: 'Bugs & Defects' },
    { id: 'suggestion', label: 'Suggestions' },
    { id: 'decision', label: 'Decisions' },
    { id: 'requirement', label: 'Requirements' },
  ];

  return (
    <div className="relative rounded-3xl border border-[var(--border-default)] bg-[var(--surface)]/80 backdrop-blur-xl flex flex-col md:flex-row h-[780px] overflow-hidden shadow-sm">
      {/* =========================================================================
          LEFT PANEL: Per-Project Chat History Sessions Drawer ("The Other Side")
         ========================================================================= */}
      <div
        className={cn(
          'border-r border-[var(--border-default)] bg-[var(--surface-raised)]/60 flex flex-col transition-all duration-300 shrink-0 z-10',
          isHistoryOpen ? 'w-full md:w-72' : 'w-0 hidden md:flex md:w-0 overflow-hidden'
        )}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Research Sessions ({chats.length})
            </span>
          </div>

          <button
            onClick={() => setIsHistoryOpen(false)}
            className="md:hidden p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Research Chat Button */}
        <div className="p-3">
          <button
            onClick={handleCreateNewChat}
            disabled={creatingChat}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{creatingChat ? 'Creating...' : '+ New Research Chat'}</span>
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--text-muted)]">
              No sessions yet.
            </div>
          ) : (
            chats.map((c) => {
              const isActive = activeChat?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectChat(c)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border text-xs transition-all duration-150 flex flex-col gap-1',
                    isActive
                      ? 'bg-[var(--surface)] border-cyan-500/40 text-[var(--text-primary)] shadow-xs font-medium'
                      : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface)]/70 hover:text-[var(--text-primary)]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-xs leading-tight">
                      {c.title}
                    </span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {formatTimeAgo(c.updatedAt || c.createdAt)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: Main AI Workspace, Citations & Chat Stream
         ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--surface)]/40 h-full">
        {/* 1. Studio Header */}
        <div className="p-4 border-b border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Toggle History Sidebar */}
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title={isHistoryOpen ? 'Collapse Sessions' : 'Expand Sessions'}
            >
              {isHistoryOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {activeChat ? activeChat.title : `${project.name} AI Research Lab`}
                </h3>
                {/* AI Online Brain Badge */}
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                  <Globe className="w-3 h-3 text-cyan-500 animate-spin-slow" />
                  <span>Online Brain Active</span>
                </div>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                Multi-grounded across specs, community reviews, and external web standards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Category filter */}
            <div className="hidden lg:flex items-center gap-1">
              {categories.slice(0, 4).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
                    selectedCategory === cat.id
                      ? 'bg-[var(--surface-raised)] border border-cyan-500/40 text-cyan-600 dark:text-cyan-400 font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadChats(activeChat?.id)}
              disabled={isLoading}
              className="text-xs p-1.5 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Refresh conversation"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* 2. Quick Research Inquiry Starters */}
        <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-raised)]/30 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase shrink-0">
              Starters:
            </span>
            {PRESET_QUERIES.map((pq) => {
              const Icon = pq.icon;
              return (
                <button
                  key={pq.id}
                  type="button"
                  onClick={() => handleSendMessage(pq.query)}
                  disabled={isSending}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface)] hover:border-cyan-500/40 hover:text-cyan-600 dark:hover:text-cyan-400 text-[11px] text-[var(--text-secondary)] transition-all whitespace-nowrap cursor-pointer"
                >
                  <Icon className="w-3 h-3 text-cyan-500 shrink-0" />
                  <span>{pq.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="m-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 3. Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                AI Research Lab Grounded in {project.name}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] max-w-md">
                Ask architectural questions, request feedback audits, or cross-reference live online standards with real user reviews.
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 max-w-3xl animate-fade-in',
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  )}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-2xs',
                      isUser
                        ? 'bg-gradient-to-br from-cyan-600 to-indigo-600 text-white'
                        : 'bg-[var(--surface-raised)] text-cyan-500 border border-[var(--border-default)]'
                    )}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={cn(
                      'p-4 rounded-2xl text-xs space-y-3 leading-relaxed shadow-sm relative group',
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-xs'
                        : 'bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-tl-xs'
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-80">
                      <span className="font-semibold">{isUser ? 'You' : 'Research Engine'}</span>
                      <div className="flex items-center gap-2">
                        {!isUser && msg.classification && getClassificationBadge(msg.classification)}
                        {!isUser && (
                          <button
                            onClick={() => copyMessageToClipboard(msg.id, msg.content)}
                            className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            title="Copy response"
                          >
                            {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-[13px]">
                      {msg.content}
                    </div>

                    {/* Categorized Grounded Evidence Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-3 border-t border-[var(--border-default)] space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3 text-cyan-500" />
                          <span>Grounded Citations ({msg.citations.length})</span>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5">
                          {msg.citations.map((c: any, idx: number) => {
                            const isWeb = c.sourceType === 'online_source' || c.url;
                            const isReview = c.sourceType === 'user_review';
                            const isSimilar = c.sourceType === 'similar_project';

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedCitation(c)}
                                className={cn(
                                  'w-full text-left p-2.5 rounded-xl border text-[11px] transition-all cursor-pointer flex items-start gap-2.5 group/cit',
                                  isWeb
                                    ? 'bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/20 text-[var(--text-secondary)]'
                                    : isReview
                                    ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-[var(--text-secondary)]'
                                    : isSimilar
                                    ? 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 text-[var(--text-secondary)]'
                                    : 'bg-[var(--surface)] hover:bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-secondary)]'
                                )}
                              >
                                <div className="mt-0.5 shrink-0">
                                  {isWeb ? (
                                    <Globe className="w-3.5 h-3.5 text-cyan-500" />
                                  ) : isReview ? (
                                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : isSimilar ? (
                                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                                      {c.sourceName || c.source_name || 'Grounded Source'}
                                    </span>
                                    {isWeb && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/10 text-cyan-600 font-mono">
                                        Web
                                      </span>
                                    )}
                                    {isReview && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-600 font-mono">
                                        Review
                                      </span>
                                    )}
                                    {isSimilar && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono">
                                        Platform Peer
                                      </span>
                                    )}
                                    {c.relevancePercentage && (
                                      <span className="ml-auto text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
                                        {c.relevancePercentage}% match
                                      </span>
                                    )}
                                  </div>
                                  <p className="line-clamp-2 text-[11px] italic mt-0.5 opacity-90">
                                    "{c.cleanQuote || c.clean_quote || c.quote}"
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 4. Input Prompt Footer */}
        <div className="p-4 border-t border-[var(--border-default)] bg-[var(--surface)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                rows={2}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isAuthenticated
                    ? `Ask about ${project.name} specifications, user complaints, or online benchmarks... (Enter to send)`
                    : 'Sign in to run custom research queries...'
                }
                disabled={!isAuthenticated || isSending}
                className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!isAuthenticated || isSending || !inputContent.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shrink-0"
              title="Send research query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* =========================================================================
          EVIDENCE CITATION INSPECTION MODAL / DRAWER
         ========================================================================= */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-500" />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  Evidence Citation Inspector
                </h4>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                  Source Name
                </span>
                <span className="font-semibold text-sm text-[var(--text-primary)]">
                  {selectedCitation.sourceName || selectedCitation.source_name || 'Grounded Source'}
                </span>
              </div>

              {selectedCitation.url && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                    Online Origin
                  </span>
                  <a
                    href={selectedCitation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    <span>{selectedCitation.url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {selectedCitation.projectId && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                    FeedbackAI Platform Peer
                  </span>
                  <Link
                    to={`/project/${selectedCitation.projectId}`}
                    className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>View #{selectedCitation.projectName || 'Project'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {selectedCitation.relevancePercentage && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                    Confidence Match
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    {selectedCitation.relevancePercentage}% Grounding Match
                  </span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-default)] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                  Verifiable Evidence Quote
                </span>
                <p className="text-xs text-[var(--text-primary)] italic leading-relaxed">
                  "{selectedCitation.cleanQuote || selectedCitation.clean_quote || selectedCitation.quote}"
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCitation(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
