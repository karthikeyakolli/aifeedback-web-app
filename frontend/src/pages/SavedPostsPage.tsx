import React, { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import type { Post } from '../types';
import { api } from '../services/api';
import { PostCard } from '../components/feed/PostCard';
import { EmptyState } from '../components/common/EmptyState';

export const SavedPostsPage: React.FC = () => {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getSavedPosts()
      .then((data) => setSavedPosts(data))
      .finally(() => setIsLoading(false));
  }, []);

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

      {isLoading ? (
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
