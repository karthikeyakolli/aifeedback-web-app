import React, { useEffect, useState } from 'react';
import { Bookmark, Lock } from 'lucide-react';
import type { Post } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/feed/PostCard';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 flex items-center gap-2.5">
          <Bookmark className="w-6 h-6 text-amber-500 fill-current" />
          Saved Discussions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Bookmarked products, reviews, and research analyses you are tracking.
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101524] space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Sign In to View Saved Discussions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Bookmarks are saved to your personal account so you can revisit critique threads and AI findings from any device.
          </p>
          <Button onClick={() => openAuthModal('login')}>
            Sign In to Account
          </Button>
        </div>
      ) : isLoading ? (
        <div className="p-8 text-center text-slate-400">Loading saved discussions...</div>
      ) : savedPosts.length > 0 ? (
        <div className="space-y-3">
          {savedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved discussions yet"
          description="Click the bookmark icon on any post to track its reviews and AI research synthesis."
          actionText="Browse Home Feed"
          onAction={() => (window.location.href = '/')}
        />
      )}
    </div>
  );
};
