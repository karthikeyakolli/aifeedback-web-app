import React, { useEffect, useState } from 'react';
import { Bookmark, Lock } from 'lucide-react';
import type { Post } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/feed/PostCard';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { CardSkeleton } from '../components/common/LoadingSkeletons';

export const SavedPostsPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    api.getSavedPosts()
      .then((data) => setSavedPosts(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 mb-1.5 uppercase tracking-wider">
          <Bookmark className="w-4 h-4 fill-current" />
          <span>Personal Bookmarks</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Saved Discussions & Products
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Review discussions and product critiques you are monitoring across the community.
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4 max-w-lg mx-auto my-8 neomorph-card">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Sign In to Access Saved Items
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Bookmarks are securely synchronized to your account so you can revisit critique threads and AI analyses from any device.
          </p>
          <Button variant="primary" onClick={() => openAuthModal('login')}>
            Sign In to Account
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : savedPosts.length > 0 ? (
        <div className="space-y-3">
          {savedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved discussions yet"
          description="Click the bookmark icon on any discussion or product profile to track its community reviews."
          actionText="Browse Community Discussions"
          onAction={() => (window.location.href = '/')}
        />
      )}
    </div>
  );
};
