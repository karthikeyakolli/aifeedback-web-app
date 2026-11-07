import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  MessageSquare,
  Sparkles,
  Shield,
  Check,
  CheckCheck,
  CornerDownRight,
} from 'lucide-react';
import type { AppNotification } from '../../types';
import { api } from '../../services/api';
import { formatTimeAgo } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll or fetch unread count
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCount = () => {
      api.getUnreadNotificationCount()
        .then((cnt) => setUnreadCount(cnt))
        .catch(() => {});
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Fetch full notifications list when opening dropdown
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      setIsLoading(true);
      api.getNotifications(filter === 'unread')
        .then((items) => setNotifications(items))
        .catch((err) => console.error('Failed to load notifications:', err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, filter, isAuthenticated]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNavigate = async (notif: AppNotification) => {
    if (!notif.isRead) {
      api.markNotificationRead(notif.id).catch(() => {});
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setIsOpen(false);
    navigate(notif.linkUrl);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reply':
        return <CornerDownRight className="w-3.5 h-3.5 text-indigo-500" />;
      case 'comment':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case 'project_review':
        return <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />;
      case 'ai_ready':
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      case 'moderation':
        return <Shield className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        role="button"
        className="relative p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold bg-indigo-600 text-white ring-2 ring-[var(--bg-surface)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown (Tactile Neomorphic) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-[var(--text-primary)]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--border-subtle)] text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Unread only
            </button>
          </div>

          {/* List Stream */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--border-subtle)]">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] animate-pulse">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-1">
                <Bell className="w-6 h-6 mx-auto text-[var(--text-muted)] mb-1 opacity-50" />
                <p className="font-bold text-[var(--text-primary)]">No notifications</p>
                <p className="text-[11px]">Replies, AI synthesis alerts, and community updates appear here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNavigate(n)}
                  className={`p-3 text-xs transition-colors cursor-pointer flex items-start gap-2.5 ${
                    !n.isRead
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40'
                      : 'hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <div className="mt-0.5 p-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] shrink-0">
                    {getTypeIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-[var(--text-primary)] truncate">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={(e) => handleMarkRead(e, n.id)}
                      title="Mark as read"
                      aria-label="Mark notification as read"
                      className="p-1 text-[var(--text-muted)] hover:text-indigo-600 shrink-0 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
