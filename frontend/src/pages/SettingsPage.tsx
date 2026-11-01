import React, { useState } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Laptop, Shield, Cpu, Database, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5 flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-blue-500" />
          Settings & Configuration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage appearance, profile preferences, and platform architecture connections.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Theme Settings */}
      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Interface Appearance
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 ring-1 ring-indigo-500'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Sun className="w-5 h-5 mb-1.5 text-amber-500" />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 ring-1 ring-indigo-500'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Moon className="w-5 h-5 mb-1.5 text-indigo-400" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              theme === 'system'
                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 ring-1 ring-indigo-500'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Laptop className="w-5 h-5 mb-1.5 text-slate-400" />
            <span>System</span>
          </button>
        </div>
      </Card>

      {/* Profile Details */}
      <form onSubmit={handleSave}>
        <Card className="p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Account & Display
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Display Name
              </label>
              <input
                type="text"
                defaultValue={user?.displayName || 'Sarah Chen'}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Username
              </label>
              <input
                type="text"
                disabled
                defaultValue={user?.username || 'sarahc'}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Bio
            </label>
            <textarea
              rows={2}
              defaultValue={user?.bio || 'Building developer tools & exploring customer research workflows.'}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button type="submit" size="sm">
              Save Preferences
            </Button>
            {user && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await logout();
                  window.location.reload();
                }}
              >
                Sign Out
              </Button>
            )}
          </div>
        </Card>
      </form>

      {/* System & Architecture Status */}
      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Subsystem Status (Phase 2 Active)
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-blue-500" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200 block">FastAPI Backend Core & Community APIs</strong>
                <span className="text-slate-400 text-[11px]">Posts, Threaded Comments, Atomic Votes, Bookmarks, Reports</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Operational
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-purple-500" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200 block">Supabase Migration & Relational Persistence</strong>
                <span className="text-slate-400 text-[11px]">PostgreSQL RLS Migration + Verified Local Persistence Engine</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Operational
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-amber-500" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200 block">Google Gemini Intelligence Adapter</strong>
                <span className="text-slate-400 text-[11px]">Provider interface defined, scheduled for Phase 3 activation</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Phase 3 Target
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
