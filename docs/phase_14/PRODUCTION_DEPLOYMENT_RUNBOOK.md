# PRODUCTION DEPLOYMENT RUNBOOK
**Project:** AI Project Feedback  
**Milestone:** Phase 14 — Final System Completion & Permanent Engineering Closure  
**Version:** 1.0.0 (Production Release)  
**Status:** AUTHORITATIVE OPERATIONAL RUNBOOK

---

## 1. Deployment Prerequisites & System Sizing

### Minimum Recommended Production Sizing
- **API Pods / Containers:** 2x instances minimum (Auto-scaling 2–10 based on CPU > 70% or queue depth).
  - CPU: 2 vCPU per instance
  - Memory: 4 GB RAM per instance
- **Worker Pods:** 2x instances minimum (Auto-scaling based on `ai_reviews` queued depth).
  - CPU: 2 vCPU per instance
  - Memory: 4 GB RAM per instance
- **Database (Supabase PostgreSQL):** Small/Medium Compute (2 vCPU, 4GB RAM) with connection pooler enabled (PgBouncer mode: `transaction`, pool size: 50).
- **Frontend Hosting:** Cloudflare Pages, Vercel, or AWS S3 + CloudFront with global edge caching.

---

## 2. Environment Variables Specification

All sensitive configuration must be injected securely via secrets managers (HashiCorp Vault, AWS Secrets Manager, or Kubernetes Secrets).

| Variable Name | Required | Default / Format | Description |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | Yes | `production` | Active environment identifier |
| `APP_VERSION` | Yes | `1.0.0` | Application release version |
| `DATABASE_URL` | Yes | `postgresql://postgres.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:6543/postgres` | Canonical Supabase PostgreSQL pooled URL |
| `JWT_SECRET_KEY` | Yes | 64-char Hex / Base64 string | Cryptographic secret for signing HMAC-SHA256 JWTs |
| `AI_VAULT_ENCRYPTION_KEY` | Yes | 32-byte Fernet key string | Master symmetric key for encrypting user BYOK credentials |
| `CORS_ORIGINS` | Yes | `["https://aiprojectfeedback.com"]` | JSON array of whitelisted origin URLs |
| `GEMINI_API_KEY` | Yes | `AIza...` | Google Gemini API key for Tier 1 review cascade |
| `ANTHROPIC_API_KEY`| Optional | `sk-ant-...` | Anthropic Claude API key for Tier 2 fallback |
| `OPENAI_API_KEY` | Optional | `sk-...` | OpenAI GPT-4o API key for Tier 3 fallback |
| `OPENROUTER_API_KEY`| Optional| `sk-or-...` | OpenRouter multi-model router key for Tier 4 fallback |
| `NVIDIA_API_KEY` | Optional | `nvapi-...` | NVIDIA NIM microservices API key for Tier 5 fallback |

---

## 3. Step-by-Step Deployment Procedure

### Step 3.1: Database Migration Deployment
Always execute database migrations prior to routing traffic to new application instances:
```bash
# 1. Verify connectivity to Supabase pooled connection
psql "$DATABASE_URL" -c "SELECT version();"

# 2. Apply all migration scripts sequentially
for file in supabase/migrations/*.sql; do
    echo "Applying $file..."
    psql "$DATABASE_URL" -f "$file"
done
```

### Step 3.2: Backend Container Build & Deployment
```bash
# 1. Build backend Docker image
docker build -t aifeedback-backend:1.0.0 -f Dockerfile .

# 2. Tag and push to production container registry
docker tag aifeedback-backend:1.0.0 registry.example.com/aifeedback-backend:1.0.0
docker push registry.example.com/aifeedback-backend:1.0.0

# 3. Roll out update on Kubernetes
kubectl apply -f deploy/kubernetes/backend-deployment.yaml
kubectl rollout status deployment/aifeedback-backend
```

### Step 3.3: Frontend Production Build & Deployment
```bash
# 1. Install dependencies
npm ci

# 2. Execute production TypeScript & Vite compilation
npm run build

# 3. Deploy build artifacts from dist/ to CDN edge
npx wrangler pages deploy dist --project-name=aifeedback-web
```

---

## 4. Post-Deployment Verification Checklist

Execute the following smoke verification immediately following deployment:

1. **Liveness Probe**:
   ```bash
   curl -f -s https://api.aiprojectfeedback.com/api/v1/health | jq .
   # Expected: status == "healthy", version == "1.0.0"
   ```
2. **Readiness Probe**:
   ```bash
   curl -f -s https://api.aiprojectfeedback.com/api/v1/health/ready | jq .
   # Expected: status == "healthy", database == "operational", worker_queue == "ready"
   ```
3. **Public Discovery Probe**:
   ```bash
   curl -f -s https://api.aiprojectfeedback.com/api/v1/projects/public | jq .
   # Expected: HTTP 200, returns array of public projects
   ```
4. **Public Read-Only Invariance Check**:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" -X POST https://api.aiprojectfeedback.com/api/v1/projects/public/any_id/upvote
   # Expected: HTTP 403 Forbidden or 404 Not Found (mutations rejected)
   ```

---

## 5. Rollback Procedure

If readiness probes fail or unexpected errors are detected post-deployment:
1. **Rollback Backend Pods**:
   ```bash
   kubectl rollout undo deployment/aifeedback-backend
   kubectl rollout status deployment/aifeedback-backend
   ```
2. **Rollback Frontend CDN**:
   ```bash
   npx wrangler pages deployment list --project-name=aifeedback-web
   npx wrangler pages rollback [PREVIOUS_DEPLOYMENT_ID]
   ```
3. **Notify Engineering Team**: Trigger incident protocol in accordance with [`PRODUCTION_MONITORING_AND_INCIDENT_RUNBOOK.md`](file:///C:/Users/OMEN/.gemini/antigravity/brain/22039a5b-f036-4ec2-a561-3a0265d31049/PRODUCTION_MONITORING_AND_INCIDENT_RUNBOOK.md).
