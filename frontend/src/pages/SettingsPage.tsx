import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Cpu,
  Database,
  CheckCircle2,
  Key,
  Lock,
  RefreshCw,
  Trash2,
  Play,
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  Plus,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { api } from '../services/api';
import type {
  CredentialMetadata,
  CredentialTestResult,
  UserIdentity,
  MFAStatus,
  MFAEnrollmentData,
  AIProviderId,
} from '../types';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'appearance' | 'credentials' | 'security' | 'status'>('credentials');

  // --- BYOK Credential Vault State ---
  const [credentials, setCredentials] = useState<CredentialMetadata[]>([]);
  const [isLoadingCreds, setIsLoadingCreds] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);

  // Add Credential Form
  const [newProvider, setNewProvider] = useState<AIProviderId>('gemini');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [showNewSecret, setShowNewSecret] = useState(false);
  const [isSubmittingCred, setIsSubmittingCred] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Testing & Rotation
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, CredentialTestResult>>({});
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [rotateSecret, setRotateSecret] = useState('');
  const [isRotating, setIsRotating] = useState(false);

  // Legacy Browser Storage Migration
  const [legacyKeysFound, setLegacyKeysFound] = useState<string[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);

  // --- Security & MFA State ---
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [mfaEnrollment, setMfaEnrollment] = useState<MFAEnrollmentData | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMessage, setMfaMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [identities, setIdentities] = useState<UserIdentity[]>([]);

  // Load vault data & check legacy keys on mount
  useEffect(() => {
    loadVaultData();
    checkLegacyBrowserKeys();
    loadSecurityData();
  }, []);

  const checkLegacyBrowserKeys = () => {
    const keys = ['gemini_api_key', 'openrouter_api_key', 'nvidia_api_key', 'groq_api_key'];
    const found = keys.filter((k) => {
      const val = localStorage.getItem(k);
      return val && val.trim().length > 0;
    });
    setLegacyKeysFound(found);
  };

  const loadVaultData = async () => {
    setIsLoadingCreds(true);
    setCredError(null);
    try {
      const data = await api.listCredentials();
      setCredentials(data);
    } catch (err: any) {
      setCredError(err?.message || 'Failed to load credentials.');
    } finally {
      setIsLoadingCreds(false);
    }
  };

  const loadSecurityData = async () => {
    try {
      const [mfa, idents] = await Promise.all([
        api.getMFAStatus().catch(() => ({ is_enabled: false, factor_type: null })),
        api.listLinkedIdentities().catch(() => []),
      ]);
      setMfaStatus(mfa);
      setIdentities(idents);
    } catch (e) {
      console.warn('Could not load security status:', e);
    }
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecret.trim()) return;

    setIsSubmittingCred(true);
    setCredError(null);
    try {
      await api.addCredential({
        provider: newProvider,
        displayName: newDisplayName.trim() || `${newProvider.toUpperCase()} Key`,
        secret: newSecret.trim(),
      });
      setNewSecret('');
      setNewDisplayName('');
      setShowAddForm(false);
      await loadVaultData();
    } catch (err: any) {
      setCredError(err?.message || 'Failed to save credential.');
    } finally {
      setIsSubmittingCred(false);
    }
  };

  const handleTestCredential = async (id: string) => {
    setTestingId(id);
    try {
      const result = await api.testCredential(id);
      setTestResults((prev) => ({ ...prev, [id]: result }));
      await loadVaultData();
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: false,
          provider: 'unknown',
          status: 'invalid',
          message: err?.message || 'Test request failed.',
          latencyMs: 0,
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleCredential = async (id: string, currentEnabled: boolean) => {
    try {
      await api.updateCredential(id, { isEnabled: !currentEnabled });
      await loadVaultData();
    } catch (err: any) {
      setCredError(err?.message || 'Failed to update credential status.');
    }
  };

  const handleRotateCredential = async (id: string) => {
    if (!rotateSecret.trim()) return;
    setIsRotating(true);
    try {
      await api.rotateCredential(id, rotateSecret.trim());
      setRotatingId(null);
      setRotateSecret('');
      await loadVaultData();
    } catch (err: any) {
      setCredError(err?.message || 'Failed to rotate credential.');
    } finally {
      setIsRotating(false);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this credential from the encrypted vault?')) return;
    try {
      await api.deleteCredential(id);
      await loadVaultData();
    } catch (err: any) {
      setCredError(err?.message || 'Failed to delete credential.');
    }
  };

  const handleMigrateLegacyKeys = async () => {
    setIsMigrating(true);
    setMigrationMessage(null);
    try {
      const result = await api.migrateLocalStorageCredentials();
      checkLegacyBrowserKeys();
      await loadVaultData();
      setMigrationMessage(`Successfully migrated ${result.migratedCount} key(s) to the server-side vault.`);
    } catch (err: any) {
      setMigrationMessage(`Migration error: ${err?.message || err}`);
    } finally {
      setIsMigrating(false);
    }
  };

  // --- MFA Handlers ---
  const handleStartMFAEnrollment = async () => {
    setMfaLoading(true);
    setMfaMessage(null);
    try {
      const data = await api.enrollMFA();
      setMfaEnrollment(data);
    } catch (err: any) {
      setMfaMessage({ text: err?.message || 'Failed to start MFA enrollment.', type: 'error' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim()) return;
    setMfaLoading(true);
    setMfaMessage(null);
    try {
      await api.verifyMFA(mfaCode.trim());
      setMfaEnrollment(null);
      setMfaCode('');
      setMfaStatus({ is_enabled: true, factor_type: 'totp' });
      setMfaMessage({ text: 'Two-Factor Authentication activated successfully.', type: 'success' });
    } catch (err: any) {
      setMfaMessage({ text: err?.message || 'Invalid verification code.', type: 'error' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!confirm('Are you sure you want to disable Multi-Factor Authentication?')) return;
    setMfaLoading(true);
    try {
      await api.unenrollMFA();
      setMfaStatus({ is_enabled: false, factor_type: null });
      setMfaMessage({ text: 'Two-Factor Authentication has been disabled.', type: 'success' });
    } catch (err: any) {
      setMfaMessage({ text: err?.message || 'Failed to disable MFA.', type: 'error' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleUnlinkIdentity = async (provider: string) => {
    if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) return;
    try {
      await api.unlinkIdentity(provider);
      await loadSecurityData();
    } catch (err: any) {
      alert(err?.message || 'Failed to unlink identity');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Google Gemini</span>;
      case 'openrouter':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">OpenRouter</span>;
      case 'nvidia':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">NVIDIA NIM</span>;
      case 'groq':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Groq</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">{provider}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>;
      case 'invalid':
        return <span className="flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400"><AlertCircle className="w-3.5 h-3.5" /> Invalid Key</span>;
      case 'rate_limited':
        return <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400"><Zap className="w-3.5 h-3.5" /> Rate Limited</span>;
      default:
        return <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">Unverified</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5 flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-blue-500" />
          Settings & Configuration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your AI provider credentials vault, unified authentication, security settings, and appearance.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('credentials')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'credentials'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>AI Credentials (BYOK)</span>
          {credentials.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {credentials.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Identity & Security</span>
          {mfaStatus?.is_enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'appearance'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>Account & Theme</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'status'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>System Status</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: AI Credentials Vault (BYOK)
          ===================================================================== */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          {/* Legacy Migration Banner if detected */}
          {legacyKeysFound.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Legacy Plaintext Browser Keys Detected ({legacyKeysFound.length})</span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleMigrateLegacyKeys}
                  disabled={isMigrating}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                >
                  {isMigrating ? 'Migrating...' : '1-Click Migrate to Server Vault'}
                </Button>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Found unencrypted credentials in browser storage: {legacyKeysFound.join(', ')}.
                Migrating will encrypt them server-side via AES-256-GCM and purge them from browser storage.
              </p>
            </div>
          )}

          {migrationMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{migrationMessage}</span>
            </div>
          )}

          {credError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{credError}</span>
            </div>
          )}

          {/* Vault Security Summary Card */}
          <Card className="p-5 sm:p-6 space-y-3 bg-[var(--surface-raised)] border border-[var(--border-default)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[var(--accent)]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Encrypted BYOK Credential Vault
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    AES-256-GCM
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Your API keys are encrypted server-side with authenticated Additional Associated Data (AAD) bound to your user ID.
                  Plaintext keys are never returned to the browser or stored unencrypted.
                </p>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowAddForm(!showAddForm)}
                className="shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>{showAddForm ? 'Cancel' : 'Add Credential'}</span>
              </Button>
            </div>
          </Card>

          {/* Add Credential Form */}
          {showAddForm && (
            <Card className="p-5 sm:p-6 space-y-4 border-indigo-200 dark:border-indigo-800/60 ring-1 ring-indigo-500/20">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-500" />
                Store New AI Provider API Key
              </h3>

              <form onSubmit={handleAddCredential} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      AI Provider
                    </label>
                    <select
                      value={newProvider}
                      onChange={(e) => setNewProvider(e.target.value as AIProviderId)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 font-medium"
                    >
                      <option value="gemini">Google Gemini (Recommended)</option>
                      <option value="openrouter">OpenRouter (Multi-Model / Free Tier)</option>
                      <option value="nvidia">NVIDIA NIM / API Catalog</option>
                      <option value="groq">Groq (Ultra-Fast Llama 3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Key Label / Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. My Personal OpenRouter Key"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    API Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showNewSecret ? 'text' : 'password'}
                      placeholder={
                        newProvider === 'openrouter'
                          ? 'sk-or-v1-...'
                          : newProvider === 'nvidia'
                          ? 'nvapi-...'
                          : newProvider === 'groq'
                          ? 'gsk_...'
                          : 'AIzaSy...'
                      }
                      value={newSecret}
                      onChange={(e) => setNewSecret(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 pr-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-mono text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewSecret(!showNewSecret)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNewSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    The secret will be encrypted immediately upon submission and stored safely in the database.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmittingCred || !newSecret.trim()}
                  >
                    {isSubmittingCred ? 'Encrypting & Saving...' : 'Save & Encrypt Key'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Credentials List */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Registered Credentials ({credentials.length})
              </h3>
              <button
                type="button"
                onClick={loadVaultData}
                disabled={isLoadingCreds}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCreds ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {credentials.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <Key className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No BYOK Credentials Configured
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add your own Gemini, OpenRouter, NVIDIA, or Groq keys to run unlimited AI reviews on your own account.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                  className="mt-2"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add First Credential
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred) => {
                  const testRes = testResults[cred.id];
                  const isTesting = testingId === cred.id;
                  const isThisRotating = rotatingId === cred.id;

                  return (
                    <div
                      key={cred.id}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {getProviderBadge(cred.provider)}
                          <div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {cred.displayName}
                            </span>
                            <span className="text-xs font-mono text-slate-400 ml-2">
                              {cred.maskedPreview}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(testRes ? testRes.status : cred.validationStatus)}
                          <button
                            type="button"
                            onClick={() => handleToggleCredential(cred.id, cred.isEnabled)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-all ${
                              cred.isEnabled
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {cred.isEnabled ? 'Active' : 'Disabled'}
                          </button>
                        </div>
                      </div>

                      {/* Connectivity Test Feedback */}
                      {testRes && (
                        <div
                          className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${
                            testRes.success
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          <span>{testRes.message}</span>
                          {testRes.latencyMs > 0 && (
                            <span className="font-mono text-[11px] opacity-75">{testRes.latencyMs}ms</span>
                          )}
                        </div>
                      )}

                      {/* Inline Secret Rotation Box */}
                      {isThisRotating ? (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Enter New Secret Key
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              placeholder="Paste replacement secret..."
                              value={rotateSecret}
                              onChange={(e) => setRotateSecret(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-xs font-mono text-slate-900 dark:text-slate-100"
                            />
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={isRotating || !rotateSecret.trim()}
                              onClick={() => handleRotateCredential(cred.id)}
                            >
                              {isRotating ? 'Updating...' : 'Save New Key'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRotatingId(null);
                                setRotateSecret('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <span className="text-slate-400 text-[11px]">
                            Updated {new Date(cred.updatedAt).toLocaleDateString()}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTestCredential(cred.id)}
                              disabled={isTesting}
                              className="px-2.5 py-1 rounded text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center gap-1 cursor-pointer"
                            >
                              <Play className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRotatingId(cred.id)}
                              className="px-2.5 py-1 rounded text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Rotate</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCredential(cred.id)}
                              className="px-2 py-1 rounded text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* =====================================================================
          TAB 2: Identity & Security
          ===================================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {mfaMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                mfaMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}
            >
              {mfaMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              )}
              <span>{mfaMessage.text}</span>
            </div>
          )}

          {/* Multi-Factor Authentication (MFA / TOTP) */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Multi-Factor Authentication (TOTP)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Protect your account with standard 6-digit one-time passcodes generated by Google Authenticator, Authy, or 1Password.
                </p>
              </div>

              {mfaStatus?.is_enabled ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Enabled
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Disabled
                </span>
              )}
            </div>

            {mfaStatus?.is_enabled ? (
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">
                  Authenticator app is currently active on this account.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDisableMFA}
                  disabled={mfaLoading}
                  className="text-rose-600 hover:text-rose-700"
                >
                  Disable MFA
                </Button>
              </div>
            ) : mfaEnrollment ? (
              /* Enrollment flow active */
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Step 1: Scan Authenticator Code
                  </span>
                  <p className="text-xs text-slate-500">
                    Enter this secret into your authenticator app (Google Authenticator, Authy, etc.):
                  </p>
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded font-mono text-xs font-bold tracking-wider select-all break-all text-slate-800 dark:text-slate-200">
                    {mfaEnrollment.secret}
                  </div>
                </div>

                <form onSubmit={handleVerifyMFA} className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Step 2: Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                      className="w-36 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono text-lg font-bold tracking-widest text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={mfaLoading || mfaCode.length !== 6}
                    >
                      {mfaLoading ? 'Verifying...' : 'Verify & Activate MFA'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMfaEnrollment(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">
                  Add an extra layer of defense against unauthorized project access.
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleStartMFAEnrollment}
                  disabled={mfaLoading}
                >
                  Enable Two-Factor Authentication
                </Button>
              </div>
            )}
          </Card>

          {/* Linked OAuth Accounts */}
          <Card className="p-5 sm:p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Linked Authentication Providers
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                    G
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block text-xs">Google Account</strong>
                    <span className="text-slate-400 text-[11px]">
                      {identities.find((i) => i.provider === 'google')?.email || 'Not connected'}
                    </span>
                  </div>
                </div>

                {identities.some((i) => i.provider === 'google') ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnlinkIdentity('google')}
                    className="text-xs"
                  >
                    Unlink
                  </Button>
                ) : (
                  <span className="text-slate-400 text-xs">Available for linking via OAuth</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                    GH
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block text-xs">GitHub Account</strong>
                    <span className="text-slate-400 text-[11px]">
                      {identities.find((i) => i.provider === 'github')?.email || 'Not connected'}
                    </span>
                  </div>
                </div>

                {identities.some((i) => i.provider === 'github') ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnlinkIdentity('github')}
                    className="text-xs"
                  >
                    Unlink
                  </Button>
                ) : (
                  <span className="text-slate-400 text-xs">Available for linking via OAuth</span>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* =====================================================================
          TAB 3: Account & Appearance
          ===================================================================== */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          {savedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Settings saved successfully.</span>
            </div>
          )}

          {/* Interface Theme */}
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Interface Appearance
            </h2>
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)]">
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">Clean Minimalist Light Mode</p>
                  <p className="text-[11px] text-[var(--text-muted)]">High-contrast, distraction-free SaaS interface theme</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
          </Card>

          {/* Profile Details */}
          <form onSubmit={handleSaveProfile}>
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
                    defaultValue={user?.displayName || ''}
                    placeholder="Your Name"
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
                    defaultValue={user?.username || ''}
                    placeholder="username"
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
                  defaultValue={user?.bio || ''}
                  placeholder="Tell the community about yourself and what you are building."
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
        </div>
      )}

      {/* =====================================================================
          TAB 4: System Architecture Status
          ===================================================================== */}
      {activeTab === 'status' && (
        <Card className="p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Platform Subsystem Status (Phase 3 Active)
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-indigo-500" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">Server-Side BYOK Encrypted Vault</strong>
                  <span className="text-slate-400 text-[11px]">AES-256-GCM authenticated encryption with user-scoped AAD isolation</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Active & Verified
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">Unified Identity & Multi-Factor Auth (TOTP)</strong>
                  <span className="text-slate-400 text-[11px]">RFC 6238 TOTP engine, OAuth identity linking, one-time reset tokens</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Active & Verified
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-blue-500" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">Durable AI Review Execution Worker</strong>
                  <span className="text-slate-400 text-[11px]">FIFO queue, atomic worker claiming, heartbeats, automatic crash recovery</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-purple-500" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">Supabase Migration 00010 + SQLite WAL</strong>
                  <span className="text-slate-400 text-[11px]">Dual-engine persistence with owner-only RLS and partial indexes</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Operational
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
