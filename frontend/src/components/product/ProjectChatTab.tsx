import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { api } from '../../services/api';
import type { Project, ProjectChat, ProjectChatMessage } from '../../types';
import { Button } from '../common/Button';
import { cn } from '../../lib/utils';

interface ProjectChatTabProps {
  project: Project;
}

export const ProjectChatTab: React.FC<ProjectChatTabProps> = ({ project }) => {
  const [_chats, setChats] = useState<ProjectChat[]>([]);
  const [activeChat, setActiveChat] = useState<ProjectChat | null>(null);
  const [messages, setMessages] = useState<ProjectChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const list = await api.listProjectChats(project.id);
      setChats(list);
      if (list.length > 0) {
        const fullChat = await api.getProjectChat(project.id, list[0].id);
        setActiveChat(fullChat);
        setMessages(fullChat.messages || []);
      } else {
        // Create an initial project discussion chat
        const created = await api.createProjectChat(
          project.id,
          `${project.name} Architecture & Feedback Chat`,
          'project_wide'
        );
        setChats([created]);
        setActiveChat(created);
        setMessages(created.messages || []);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize project chat.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, [project.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeChat || isSending) return;

    const userText = inputContent.trim();
    setInputContent('');
    setIsSending(true);

    // Optimistically add user message to list
    const tempUserMsg: ProjectChatMessage = {
      id: `temp_${Date.now()}`,
      chatId: activeChat.id,
      role: 'user',
      content: userText,
      citations: [],
      classification: 'question',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const assistantMsg = await api.sendProjectChatMessage(project.id, activeChat.id, userText);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const getClassificationBadge = (cls: string) => {
    const map: Record<string, { label: string; color: string }> = {
      decision: { label: 'Decision', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
      question: { label: 'Question', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
      clarification: { label: 'Clarification', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
      code_generation: { label: 'Code Solution', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
      general: { label: 'General', color: 'bg-slate-500/10 text-slate-500' },
    };
    const c = map[cls] || map.general;
    return (
      <span className={cn('px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase', c.color)}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4 flex flex-col h-[650px]">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
            <span>AI Project Assistant</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Context-grounded assistant with instant retrieval over your Project Knowledge Base.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadChats} disabled={isLoading} className="text-xs gap-1">
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Message History Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Sparkles className="w-8 h-8 text-[var(--accent)] opacity-60" />
            <h4 className="text-xs font-bold text-[var(--text-primary)]">Start an Architectural Conversation</h4>
            <p className="text-[11px] text-[var(--text-muted)] max-w-sm">
              Ask about trade-offs, explore findings, request code snippets, or evaluate missing security specifications.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={cn('flex gap-3 max-w-3xl', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs',
                    isUser
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  )}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={cn(
                    'p-3.5 rounded-2xl text-xs space-y-2 leading-relaxed',
                    isUser
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-default)]'
                  )}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                    <span>{isUser ? 'You' : 'AI Assistant'}</span>
                    {!isUser && msg.classification && getClassificationBadge(msg.classification)}
                  </div>

                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Evidence Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border-default)] space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-[var(--accent)]" /> Verified Evidence Citations
                      </div>
                      <div className="space-y-1">
                        {msg.citations.map((c, idx) => (
                          <div
                            key={idx}
                            className="p-1.5 rounded-lg bg-[var(--surface)] text-[11px] border border-[var(--border-default)] text-[var(--text-secondary)] italic"
                          >
                            <span className="font-semibold not-italic text-[var(--text-primary)] mr-1">
                              [{c.source_name || c.sourceName || 'Source'}]:
                            </span>
                            "{c.quote || c.clean_quote}"
                          </div>
                        ))}
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

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="pt-2 border-t border-[var(--border-default)] flex gap-2">
        <input
          type="text"
          placeholder="Ask a technical question or discuss architectural trade-offs..."
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          disabled={isSending}
          className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-hover)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSending || !inputContent.trim()}
          className="text-xs font-semibold gap-1.5 px-4"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSending ? 'Thinking...' : 'Send'}</span>
        </Button>
      </form>
    </div>
  );
};
