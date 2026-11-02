import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Save,
  RotateCcw,
  GitBranch,
  Globe,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Shield,
  Eye,
} from 'lucide-react';
import type { CreatorProfile } from '../../types';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';

export const CreatorProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Status State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    api.getCreatorStudio()
      .then((studio) => {
        const p = studio.profile;
        setProfile(p);
        setDisplayName(p.displayName || '');
        setBio(p.bio || '');
        setGithubUrl(p.githubUrl || '');
        setWebsiteUrl(p.websiteUrl || '');
        setSkills(p.skills || []);
      })
      .catch((err) => {
        setLoadError(err.message || 'Failed to load creator profile');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setSkills([...skills, trimmed]);
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) {
      errs.displayName = 'Display Name is required';
    }
    if (githubUrl.trim()) {
      const u = githubUrl.trim();
      if (!u.startsWith('http://') && !u.startsWith('https://')) {
        errs.githubUrl = 'GitHub URL must start with http:// or https://';
      }
    }
    if (websiteUrl.trim()) {
      const u = websiteUrl.trim();
      if (!u.startsWith('http://') && !u.startsWith('https://')) {
        errs.websiteUrl = 'Website URL must start with http:// or https://';
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updated = await api.updateCreatorProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        githubUrl: githubUrl.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        skills,
      });

      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!profile) return;
    setDisplayName(profile.displayName || '');
    setBio(profile.bio || '');
    setGithubUrl(profile.githubUrl || '');
    setWebsiteUrl(profile.websiteUrl || '');
    setSkills(profile.skills || []);
    setFieldErrors({});
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 animate-pulse">
        <div className="w-48 h-5 bg-[var(--surface-hover)] rounded-md" />
        <div className="w-1/3 h-8 bg-[var(--surface-hover)] rounded-md" />
        <div className="h-64 bg-[var(--surface)] border border-[var(--border-default)] rounded-2xl" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto text-amber-500" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Unable to Load Profile</h2>
        <p className="text-xs text-[var(--text-muted)]">{loadError || 'An unexpected error occurred.'}</p>
        <Link to="/creator">
          <Button variant="outline" size="sm">
            Back to Creator Studio
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <User className="w-4 h-4" />
            <span>Maker Identity & Credentials</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Creator Profile
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Configure how your maker credentials, engineering bio, and technical stack appear across published showcases.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/creators/${profile.username}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <Eye className="w-3.5 h-3.5 text-sky-500" />
              <span>Public Maker View</span>
            </Button>
          </Link>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 2. Main Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Form Controls (2 cols) */}
        <form onSubmit={handleSave} className="md:col-span-2 space-y-5">
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Maker Bio & Identification
            </h2>

            {/* Display Name */}
            <div className="space-y-1.5">
              <label htmlFor="maker-name" className="text-xs font-bold text-[var(--text-primary)]">
                Public Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="maker-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Rivera, Lead Architect"
                className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
              {fieldErrors.displayName && (
                <p className="text-[11px] text-rose-500">{fieldErrors.displayName}</p>
              )}
            </div>

            {/* Username (Identity Guard) */}
            <div className="space-y-1.5">
              <label htmlFor="maker-username" className="text-xs font-bold text-[var(--text-muted)]">
                Maker Username (Handle)
              </label>
              <input
                id="maker-username"
                type="text"
                value={`@${profile.username}`}
                disabled
                className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-muted)] cursor-not-allowed font-mono"
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                Fixed account handle for routing public showcases at <code className="font-mono">/creators/{profile.username}</code>.
              </p>
            </div>

            {/* Maker Bio */}
            <div className="space-y-1.5">
              <label htmlFor="maker-bio" className="text-xs font-bold text-[var(--text-primary)]">
                Maker Biography
              </label>
              <textarea
                id="maker-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell reviewers about your engineering focus, architectural background, or open-source projects..."
                className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] leading-relaxed"
              />
              <p className="text-[11px] text-[var(--text-muted)] text-right">{bio.length}/500</p>
            </div>
          </div>

          {/* Technical Skills & Stack */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Core Technical Skills & Stack
            </h2>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="e.g. Python, TypeScript, Distributed Systems..."
                  className="flex-1 px-3 py-2 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSkill}
                  className="text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </Button>
              </div>

              {/* Skills Tags List */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {skills.length === 0 ? (
                  <span className="text-xs text-[var(--text-muted)] italic">
                    No technical skills added yet. Press Enter or click Add.
                  </span>
                ) : (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        aria-label={`Remove skill ${skill}`}
                        className="hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* External Links */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              External Developer Links
            </h2>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="maker-github" className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>GitHub Profile URL</span>
                </label>
                <input
                  id="maker-github"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
                {fieldErrors.githubUrl && (
                  <p className="text-[11px] text-rose-500">{fieldErrors.githubUrl}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="maker-website" className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Portfolio / Personal Website</span>
                </label>
                <input
                  id="maker-website"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://maker.example.dev"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-[var(--border-default)] bg-[var(--canvas)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
                {fieldErrors.websiteUrl && (
                  <p className="text-[11px] text-rose-500">{fieldErrors.websiteUrl}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              disabled={isSaving}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard Changes</span>
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving}
              className="text-xs font-bold gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </Button>
          </div>
        </form>

        {/* Right Column: Live Public Preview Card (1 col) */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span>Live Public Preview</span>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0">
                {(displayName || profile.username).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-base text-[var(--text-primary)] truncate">
                  {displayName || 'Maker Name'}
                </h3>
                <div className="text-xs font-mono text-[var(--text-muted)]">
                  @{profile.username}
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
              "{bio || 'No biography specified yet. Share your engineering focus.'}"
            </p>

            {skills.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[var(--border-default)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Core Skills
                </span>
                <div className="flex flex-wrap gap-1">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-default)] text-[10px] font-mono text-[var(--text-secondary)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(githubUrl || websiteUrl) && (
              <div className="pt-2 border-t border-[var(--border-default)] flex flex-wrap gap-2 text-xs">
                {githubUrl && (
                  <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                    <GitBranch className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">GitHub</span>
                  </span>
                )}
                {websiteUrl && (
                  <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                    <Globe className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">Website</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] flex items-start gap-2.5 text-xs text-[var(--text-muted)]">
            <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your email address and personal project details remain strictly quarantined and will never appear on public creator pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
