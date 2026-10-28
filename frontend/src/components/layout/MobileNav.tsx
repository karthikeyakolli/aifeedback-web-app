import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, Compass, Bookmark, Activity, Plus } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Feed', icon: <Layers className="w-5 h-5" /> },
    { to: '/explore', label: 'Explore', icon: <Compass className="w-5 h-5" /> },
    { to: '/create', label: 'Post', icon: <Plus className="w-5 h-5" />, highlight: true },
    { to: '/saved', label: 'Saved', icon: <Bookmark className="w-5 h-5" /> },
    { to: '/activity', label: 'Activity', icon: <Activity className="w-5 h-5" /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md px-3 py-2 flex items-center justify-around">
      {links.map((link) => {
        const isActive = location.pathname === link.to;

        if (link.highlight) {
          return (
            <Link
              key={link.to}
              to={link.to}
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div className="w-11 h-11 rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                {link.icon}
              </div>
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                {link.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {link.icon}
            <span className="text-[10px] mt-0.5">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
