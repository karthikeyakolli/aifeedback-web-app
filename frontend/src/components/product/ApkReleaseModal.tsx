import React, { useState, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileCode,
  AlertTriangle,
  Download,
  CheckCircle2,
  Ban,
  Check,
  Copy,
} from 'lucide-react';
import type { ProjectApkRelease } from '../../types';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { formatTimeAgo } from '../../lib/utils';

interface ApkReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  isOwner?: boolean;
}

export const ApkReleaseModal: React.FC<ApkReleaseModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  isOwner = false,
}) => {
  const [releases, setReleases] = useState<ProjectApkRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  // Upload Form State (for Owners)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [versionName, setVersionName] = useState('');
  const [versionCode, setVersionCode] = useState('1');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [packageName, setPackageName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    loadReleases();
  }, [isOpen, projectId]);

  const loadReleases = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProjectApkReleases(projectId);
      setReleases(data);
    } catch (err) {
      console.error('Failed to load APK releases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.apk')) {
        setUploadError('Only .apk packages are supported.');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      // Auto-populate version name if not set
      if (!versionName) {
        const match = file.name.match(/v?(\d+\.\d+(\.\d+)?)/i);
        if (match) setVersionName(match[1]);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !versionName.trim()) {
      setUploadError('Please select an APK file and specify a version name.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('version_name', versionName.trim());
      formData.append('version_code', versionCode || '1');
      formData.append('release_notes', releaseNotes.trim());
      formData.append('package_name', packageName.trim());

      await api.uploadProjectApk(projectId, formData);
      setUploadSuccess(true);
      setSelectedFile(null);
      setVersionName('');
      setReleaseNotes('');
      await loadReleases();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload APK release');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStatusChange = async (releaseId: string, newStatus: string) => {
    try {
      await api.updateProjectApkReleaseStatus(projectId, releaseId, newStatus);
      await loadReleases();
    } catch (err: any) {
      alert(err.message || 'Failed to update release status');
    }
  };

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Android APK Releases"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[var(--surface)] text-[var(--text-primary)] rounded-3xl border border-[var(--border-default)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[var(--border-default)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Android APK Releases
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {projectName} • Verified Distribution
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Sideloading & Verification Notice */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="space-y-1">
              <p className="font-semibold">Security & Sideloading Notice</p>
              <p className="text-[11px] leading-relaxed opacity-90">
                All APK builds are checksum-verified with SHA-256. New releases start in quarantine pending creator verification. Always confirm the checksum prior to installing on physical Android devices.
              </p>
            </div>
          </div>

          {/* Owner Upload Form */}
          {isOwner && (
            <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-raised)]/20 space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[var(--accent)]" />
                <span>Publish New Android Release</span>
              </h3>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Version Name *
                    </label>
                    <input
                      type="text"
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                      placeholder="e.g. 1.2.0"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Version Code *
                    </label>
                    <input
                      type="number"
                      value={versionCode}
                      onChange={(e) => setVersionCode(e.target.value)}
                      placeholder="e.g. 12"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Android Package Name (optional)
                  </label>
                  <input
                    type="text"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="e.g. com.feedbackai.app"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Release Notes
                  </label>
                  <textarea
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    placeholder="Describe improvements, fixes, or requirements in this build..."
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    APK Binary File *
                  </label>
                  <input
                    type="file"
                    accept=".apk,application/vnd.android.package-archive"
                    onChange={handleFileChange}
                    className="w-full text-xs text-[var(--text-muted)] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--accent)] file:text-white file:cursor-pointer"
                  />
                </div>

                {uploadError && (
                  <p className="text-xs text-red-500 font-medium">{uploadError}</p>
                )}

                {uploadSuccess && (
                  <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>APK uploaded successfully to quarantine.</span>
                  </p>
                )}

                <Button
                  type="submit"
                  size="sm"
                  disabled={isUploading || !selectedFile}
                  className="w-full sm:w-auto"
                >
                  {isUploading ? 'Uploading & Computing SHA-256...' : 'Upload Release'}
                </Button>
              </form>
            </div>
          )}

          {/* Releases List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Available Releases ({releases.length})
            </h3>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                Loading release history...
              </div>
            ) : releases.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[var(--border-default)] rounded-2xl text-xs text-[var(--text-muted)]">
                No published APK releases yet for this project.
              </div>
            ) : (
              releases.map((rel) => {
                const downloadUrl = api.getApkDownloadUrl(projectId, rel.id);
                const isQuarantined = rel.status === 'quarantined';
                const isPublished = rel.status === 'published';

                return (
                  <div
                    key={rel.id}
                    className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/40 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--text-primary)]">
                          v{rel.versionName}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          (Build #{rel.versionCode})
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isPublished
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : isQuarantined
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-600 border border-red-500/20'
                          }`}
                        >
                          {rel.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span>{formatFileSize(rel.fileSizeBytes)}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(rel.createdAt)}</span>
                        <span>•</span>
                        <span>{rel.downloadCount} downloads</span>
                      </div>
                    </div>

                    {rel.releaseNotes && (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {rel.releaseNotes}
                      </p>
                    )}

                    {/* Checksum & Download Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--border-default)]/50 text-xs">
                      {/* Checksum */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-[220px]">
                          SHA256: {rel.fileSha256}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopySha(rel.fileSha256)}
                          title="Copy SHA-256 Hash"
                          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          {copiedSha === rel.fileSha256 ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isOwner && isQuarantined && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(rel.id, 'published')}
                            className="text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            <span>Approve & Publish</span>
                          </Button>
                        )}

                        {isOwner && isPublished && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(rel.id, 'revoked')}
                            className="text-xs py-1 px-2.5 text-red-500 hover:bg-red-500/10 border-red-500/20"
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" />
                            <span>Revoke</span>
                          </Button>
                        )}

                        {isPublished ? (
                          <a
                            href={downloadUrl}
                            download={rel.fileName}
                            className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white font-semibold text-xs transition-opacity shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download APK</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-amber-500 italic">
                            In Quarantine
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--canvas)] flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
