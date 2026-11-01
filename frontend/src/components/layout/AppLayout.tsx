import React, { useState } from 'react';
import { Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { AppLoadingScreen } from '../common/AppLoadingScreen';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isLoading } = useAuth();

  // Persistent sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('pri_sidebar_collapsed') === 'true';
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('pri_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Determine container maximum width based on page type (Section 5 requirement)
  const getContentContainerClass = (): string => {
    const path = location.pathname;
    const tab = searchParams.get('tab');

    // Research Studio 3-pane workspace gets fluid/ultra-wide layout
    if (path.startsWith('/posts/') && tab === 'insights') {
      return 'max-w-[1600px] px-3 sm:px-6';
    }

    // Discussion reading & composition gets focused reading layout
    if (path.startsWith('/posts/')) {
      return 'max-w-4xl px-4 sm:px-6';
    }

    // Moderation queue & reports get broad administrative layout
    if (path.startsWith('/moderation')) {
      return 'max-w-7xl px-4 sm:px-6';
    }

    // Standard community feed & explore grids
    return 'max-w-6xl px-4 sm:px-6';
  };

  if (isLoading) {
    return (
      <AppLoadingScreen
        onRetry={() => window.location.reload()}
        onContinueGuest={() => {
          // Allow bypass to view feed as guest
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors antialiased">
      {/* Desktop Sidebar (~240px or ~72px) */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header (~64px) */}
        <Header onOpenMobileMenu={() => setIsMobileDrawerOpen(true)} />

        {/* Mobile Slide-Over Navigation Sheet */}
        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
        />

        {/* Dynamic Main Body Content */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 w-full mx-auto py-6 pb-24 md:pb-12 transition-all ${getContentContainerClass()}`}
        >
          <Outlet />
        </main>

        {/* Application Footer */}
        <Footer />

        {/* Mobile Bottom Navigation Bar (< 768px) */}
        <MobileNav />
      </div>
    </div>
  );
};
