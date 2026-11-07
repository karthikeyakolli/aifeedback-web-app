import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { RightInspector } from './RightInspector';
import { MobileDrawer } from './MobileDrawer';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { AppLoadingScreen } from '../common/AppLoadingScreen';
import { CommandPalette } from '../common/CommandPalette';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isLoading } = useAuth();

  const isHomePage = location.pathname === '/';

  // Persistent sidebar collapse state (68-72px vs 240-256px)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('pri_sidebar_collapsed') === 'true';
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Command Palette Shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('pri_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Determine container maximum width based on page type
  const getContentContainerClass = (): string => {
    if (isHomePage) {
      return 'w-full p-0 m-0';
    }

    const path = location.pathname;
    const tab = searchParams.get('tab');

    if (path.startsWith('/posts/') && tab === 'insights') {
      return 'max-w-[1600px] px-3 sm:px-6 py-6';
    }

    if (path.includes('/feedback') || path.includes('/review') || path.startsWith('/projects/')) {
      return 'max-w-[1400px] px-4 sm:px-6 py-6';
    }

    if (path.startsWith('/moderation')) {
      return 'max-w-7xl px-4 sm:px-6 py-6';
    }

    return 'max-w-6xl px-4 sm:px-6 py-6';
  };

  if (isLoading) {
    return (
      <AppLoadingScreen
        onRetry={() => window.location.reload()}
        onContinueGuest={() => {
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--canvas)] text-[var(--text-primary)] transition-colors antialiased">
      {/* Desktop Sidebar: Hidden on Homepage for immersive full-width SaaS landing experience */}
      {!isHomePage && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header: Rendered exclusively on the Hero Landing Page per design requirement */}
        {isHomePage && <Header />}

        {/* Global Keyboard Command Palette (Cmd+K / Ctrl+K) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />

        {/* Mobile Slide-Over Navigation Sheet */}
        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
        />

        {/* Center Canvas */}
        <div className="flex-1 flex min-w-0">
          <main
            id="main-content"
            tabIndex={-1}
            className={`flex-1 w-full mx-auto transition-all ${getContentContainerClass()}`}
          >
            <Outlet />
          </main>

          {/* Contextual Right Inspector Panel (Only in internal workspaces, never on homepage) */}
          {!isHomePage && <RightInspector />}
        </div>

        {/* App Footer: Rendered on internal pages. On homepage, HomePage renders its own rich HomeFooter */}
        {!isHomePage && <Footer />}

        {/* Mobile Bottom Navigation Bar (< 640px) */}
        {!isHomePage && <MobileNav onOpenMenu={() => setIsMobileDrawerOpen(true)} />}
      </div>
    </div>
  );
};
