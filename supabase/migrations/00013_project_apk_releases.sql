-- 00013_project_apk_releases.sql
-- Android APK Releases & Quarantine Verification (Section 10)

CREATE TABLE IF NOT EXISTS project_apk_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    version_name TEXT NOT NULL,
    version_code INTEGER DEFAULT 1,
    release_notes TEXT DEFAULT '',
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_sha256 TEXT NOT NULL,
    package_name TEXT DEFAULT '',
    min_sdk_version INTEGER DEFAULT 21,
    target_sdk_version INTEGER DEFAULT 34,
    status TEXT NOT NULL DEFAULT 'quarantined' CHECK (status IN ('quarantined', 'verified', 'published', 'revoked')),
    quarantine_reason TEXT DEFAULT 'Pending automated malware and signature scan',
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_apk_releases_project ON project_apk_releases(project_id);
CREATE INDEX IF NOT EXISTS idx_apk_releases_status ON project_apk_releases(status);

ALTER TABLE project_apk_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read verified apk releases" ON project_apk_releases
    FOR SELECT USING (status = 'published');

CREATE POLICY "Owners manage project apk releases" ON project_apk_releases
    FOR ALL USING (auth.uid() = user_id);
