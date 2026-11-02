import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Bookmark,
  Activity,
  Plus,
  Home,
  FolderKanban,
  Palette,
  Menu,
} from 'lucide-react';
import { useSpace } from '../../context/SpaceContext';
import { cn } from '../../lib/utils';

interface MobileNavProps {
  onOpenMenu?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenMenu }) => {
  const location = useLocation();
  const { currentSpace } = useSpace();

  const getLinks = () => {
    switch (currentSpace) {
      case 'personal':
        return [
          { to: '/personal', label: 'Projects', icon: FolderKanban },
          { to: '/personal/projects/new', label: 'New', icon: Plus, highlight: true },
          { to: '/activity', label: 'Activity', icon: Activity },
          { to: '/saved', label: 'Saved', icon: Bookmark },
        ];
      case 'creator':
        return [
          { to: '/creator', label: 'Studio', icon: Palette },
          { to: '/creator/profile', label: 'Profile', icon: Activity },
          { to: '/developer', label: 'Lab', icon: Plus, highlight: true },
          { to: '/saved', label: 'Saved', icon: Bookmark },
        ];
      case 'public':
      default:
        return [
          { to: '/', label: 'Overview', icon: Home },
          { to: '/explore', label: 'Explore', icon: Compass },
          { to: '/create', label: 'Post', icon: Plus, highlight: true },
          { to: '/saved', label: 'Saved', icon: Bookmark },
        ];
    }
  };

  const links = getLinks();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-default)] bg-[var(--surface)]/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around select-none"
    >
      {links.map((link) => {
        const isActive = location.pathname === link.to;
        const Icon = link.icon;

        if (link.highlight) {
          return (
            <Link
              key={link.to}
              to={link.to}
              className="flex flex-col items-center justify-center -mt-4"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-[var(--text-secondary)] mt-0.5">
                {link.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors',
              isActive
                ? 'text-[var(--accent)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">{link.label}</span>
          </Link>
        );
      })}

      {/* Quick Menu Button to open Mobile Drawer */}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open full space menu"
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
      >
        <Menu className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Menu</span>
      </button>
    </nav>
  );
};
