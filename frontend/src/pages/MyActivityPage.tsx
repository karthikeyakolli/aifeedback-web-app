import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus } from 'lucide-react';
import type { Post } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/feed/PostCard';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const MyActivityPage: React.FC = () => {
  const { user } = useAuth();
  const [myPosts, setMyPosts] = useState<Post[]>([]);

  useEffect(() => {
    api.getPosts().then((posts) => {
      // Filter posts authored by current demo user
      setMyPosts(posts.filter((p) => p.author.username === user?.username));
    });
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header Profile summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111625]">
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/20"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-lg">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.displayName}
              </h1>
              <span className="text-xs text-slate-400 font-mono">@{user?.username}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.bio}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
              <span>Reputation: <strong className="text-slate-700 dark:text-slate-300">{user?.reputationScore}</strong></span>
              <span>·</span>
              <span>Published Discussions: <strong className="text-slate-700 dark:text-slate-300">{myPosts.length}</strong></span>
            </div>
          </div>
        </div>

        <Button size="sm" onClick={() => (window.location.href = '/create')} leftIcon={<Plus className="w-4 h-4" />}>
          New Discussion
        </Button>
      </div>

      {/* Anonymity Guarantee Banner */}
      <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold block mb-0.5">Privacy & Anonymity Enforcement</strong>
          <p className="leading-relaxed text-emerald-700 dark:text-emerald-400/90">
            Contributions you marked as "Anonymous" are cryptographically shielded from public profile responses and search indexing. Only you can manage them from your private dashboard.
          </p>
        </div>
      </div>

      {/* Published Discussions */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Your Product Discussions ({myPosts.length})
        </h2>

        {myPosts.length > 0 ? (
          <div className="space-y-3">
            {myPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-slate-400 text-xs">
            You have not published any review requests yet.
          </Card>
        )}
      </div>
    </div>
  );
};
