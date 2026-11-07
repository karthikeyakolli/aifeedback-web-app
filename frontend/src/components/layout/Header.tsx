import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Settings,
  LogOut,
  User,
  FolderKanban,
  Bookmark,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { AboutModal } from '../common/AboutModal';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '../common/Dropdown';
import { cn } from '../../lib/utils';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenCommandPalette?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const isHomePage = location.pathname === '/';

  const handleAboutClick = (e: React.MouseEvent) => {
    if (isHomePage) {
      const el = document.getElementById('about');
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    setIsAboutOpen(true);
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 w-full h-16 border-b border-[var(--border-default)] bg-[var(--surface)]/95 backdrop-blur-sm transition-all',
          className
        )}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Minimalist Brand Identity */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                FeedbackAI
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium tracking-wide uppercase">
                Product Intelligence Network
              </span>
            </div>
          </Link>

          {/* Right: SaaS Options - Theme, Notifications, About & Auth */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Theme Toggle Button */}
            <ThemeSwitcher />

            {/* Notifications Bell for Authenticated Users */}
            {isAuthenticated && <NotificationBell />}

            {/* About Platform Link */}
            <button
              type="button"
              onClick={handleAboutClick}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="hidden sm:inline">About</span>
            </button>

            {isAuthenticated && user ? (
              <Dropdown>
                <DropdownTrigger asChild>
                  <button
                    type="button"
                    aria-label="User account menu"
                    className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[var(--accent)]/30 transition-all cursor-pointer"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-[var(--border-default)]"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs ring-1 ring-[var(--border-default)]">
                        {user.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="hidden sm:inline text-xs font-medium text-[var(--text-primary)] max-w-[120px] truncate">
                      {user.displayName}
                    </span>
                  </button>
                </DropdownTrigger>

                <DropdownContent align="end" className="w-52 p-1.5">
                  <div className="px-2.5 py-1.5">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user.displayName}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate font-mono">@{user.username}</p>
                  </div>
                  <DropdownSeparator />

                  <DropdownItem asChild>
                    <Link to="/profile" className="flex items-center text-xs">
                      <User className="w-3.5 h-3.5 mr-2 text-[var(--accent)]" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownItem>
                  <DropdownItem asChild>
                    <Link to="/my-projects" className="flex items-center text-xs">
                      <FolderKanban className="w-3.5 h-3.5 mr-2 text-[var(--text-secondary)]" />
                      <span>My Projects</span>
                    </Link>
                  </DropdownItem>
                  <DropdownItem asChild>
                    <Link to="/saved" className="flex items-center text-xs">
                      <Bookmark className="w-3.5 h-3.5 mr-2 text-[var(--text-secondary)]" />
                      <span>Saved Projects</span>
                    </Link>
                  </DropdownItem>

                  <DropdownSeparator />
                  <DropdownItem asChild>
                    <Link to="/settings" className="flex items-center text-xs">
                      <Settings className="w-3.5 h-3.5 mr-2 text-[var(--text-muted)]" />
                      <span>Settings</span>
                    </Link>
                  </DropdownItem>
                  <DropdownSeparator />

                  <DropdownItem destructive onClick={() => logout()} className="text-xs">
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    <span>Sign Out</span>
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            ) : (
              /* Minimalist SaaS Sign In & Sign Up Options */
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-semibold text-xs px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="font-semibold text-xs px-3.5 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] shadow-2xs">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Interactive About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
};
