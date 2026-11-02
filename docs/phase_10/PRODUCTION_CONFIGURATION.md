# Phase 10: Production Configuration Specification

## 1. Environment Variable Architecture

The production environment separates public frontend variables (`VITE_` prefix) from confidential backend operational variables.
Under zero-trust principles, secrets and service role keys are never bundled into the client distribution.

### Backend Production Environment (`.env.production`)

```ini
# =============================================================================
# Core Runtime Environment
# =============================================================================
ENVIRONMENT=production
LOG_LEVEL=INFO
APP_NAME="AI Project Feedback Platform"
HOST=0.0.0.0
PORT=8000

# =============================================================================
# Domain, Routing & CORS Security
# =============================================================================
# Canonical domain for web client
ALLOWED_CORS_ORIGINS=["https://app.aiprojectfeedback.com","https://aiprojectfeedback.com"]
MAX_REQUEST_SIZE_BYTES=2097152

# =============================================================================
# Canonical Production Database (PostgreSQL / Supabase)
# =============================================================================
DATABASE_URL=postgresql://postgres:[SECURE_DB_PASSWORD]@db.[REF].supabase.co:5432/postgres
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_ANON_KEY=[PRODUCTION_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[PRODUCTION_SERVICE_ROLE_KEY]

# =============================================================================
# Authentication & Session Tokens
# =============================================================================
# In production, AUTH_PROVIDER must strictly be 'supabase' (local dev auth is disabled)
AUTH_PROVIDER=supabase
SUPABASE_JWT_SECRET=[PRODUCTION_JWT_SECRET]
SUPABASE_JWT_ALGORITHM=HS256

# =============================================================================
# AI Provider Credentials & Model Orchestration
# =============================================================================
AI_PROVIDER=gemini
GEMINI_API_KEY=[PRODUCTION_GEMINI_API_KEY]
GEMINI_MODEL=gemini-3.8-flash
AI_REQUEST_TIMEOUT_SECONDS=45
AI_MAX_RETRIES=2
GEMINI_MAX_OUTPUT_TOKENS=4096
AI_COOLDOWN_SECONDS=15
```

### Frontend Production Environment (`frontend/.env.production`)

```ini
# Vite Public Runtime Environment
VITE_API_URL=https://api.aiprojectfeedback.com/api/v1
VITE_APP_TITLE="AI Project Feedback Platform"
VITE_SUPABASE_URL=https://[REF].supabase.co
VITE_SUPABASE_ANON_KEY=[PRODUCTION_ANON_KEY]
VITE_ENABLE_MOCK_FALLBACK=false
```

---

## 2. HTTPS & Reverse Proxy Configuration (Nginx / Cloudflare)

Production deployments terminate SSL/TLS at the reverse proxy layer (e.g. Cloudflare or Nginx) using TLS 1.3:

```nginx
# Production Nginx Gateway
server {
    listen 443 ssl http2;
    server_name api.aiprojectfeedback.com;

    ssl_certificate /etc/letsencrypt/live/api.aiprojectfeedback.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.aiprojectfeedback.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Request Body Size Limitation (2MB)
    client_max_body_size 2M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}
```

