# Sentinel — Deployment Guide

## Overview

Sentinel consists of two services:
- **Backend**: FastAPI (Python) — handles analysis pipeline, AI classification, database
- **Frontend**: Vite/React — served as a static site behind nginx

Three deployment options are covered below, ordered from simplest to most production-ready.

---

## Prerequisites

Before deploying, you need API keys for the services Sentinel uses:

| Key | Where to get it | Required? |
|-----|----------------|-----------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Yes (Claude AI) |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | Yes (Llama AI) |
| `DETECTION_API_KEY` | [thehive.ai](https://thehive.ai) | Yes (deepfake detection) |
| `VIRUSTOTAL_API_KEY` | [virustotal.com](https://www.virustotal.com/gui/my-apikey) | Optional |
| `GOOGLE_SAFE_BROWSING_KEY` | [developers.google.com/safe-browsing](https://developers.google.com/safe-browsing/v4/get-started) | Optional |

Copy `.env.example` → `.env` and fill in your keys before starting.

---

## Option A — Docker Compose (Local or VPS) ⭐ Recommended

This is the simplest path — Docker Compose builds both services and nginx handles routing automatically. No separate API URL configuration needed.

### Local development / testing

```bash
# 1. Clone the repo
git clone https://github.com/IS492-SP26/team-project-deepfakes.git
cd team-project-deepfakes/Sentinel\ Application

# 2. Set up environment variables
cp .env.example .env
# Edit .env and fill in your API keys

# 3. Build and start
docker compose up --build

# 4. Open in browser
# http://localhost:5173
```

The frontend (port 5173) and backend (port 8000) start together. nginx proxies all `/api` requests from the frontend to the backend internally — no cross-origin issues.

### Stopping / resetting

```bash
# Stop services
docker compose down

# Stop and wipe the database
docker compose down -v

# Reset database only
docker compose exec backend python scripts/reset_db.py
```

### Deploying to a VPS (DigitalOcean, AWS EC2, Hetzner, etc.)

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Install Docker + Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 3. Clone and configure
git clone https://github.com/IS492-SP26/team-project-deepfakes.git
cd team-project-deepfakes/Sentinel\ Application
cp .env.example .env
nano .env   # Fill in your real API keys

# 4. Start (detached)
docker compose up --build -d

# 5. View logs
docker compose logs -f
```

**Access**: `http://your-server-ip:5173`

**For HTTPS with a domain**: Add [Caddy](https://caddyserver.com/) as a reverse proxy in front of port 5173:

```
# /etc/caddy/Caddyfile
yourdomain.com {
    reverse_proxy localhost:5173
}
```

Then run `caddy start` — Caddy handles SSL certificates automatically via Let's Encrypt.

---

## Option B — Render (Free tier, one-click cloud)

Render can host both the backend API and frontend static site for free.

### Step 1 — Deploy the backend

1. Go to [render.com](https://render.com) → New → **Web Service**
2. Connect your GitHub repo: `IS492-SP26/team-project-deepfakes`
3. Configure the service:
   - **Name**: `sentinel-backend`
   - **Root Directory**: `Sentinel Application/app/backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Under **Environment Variables**, add all keys from `.env.example`:
   - `ANTHROPIC_API_KEY` = your key
   - `GROQ_API_KEY` = your key
   - `DETECTION_API_KEY` = your key
   - `ALLOWED_ORIGINS` = `https://sentinel-frontend.onrender.com` (your frontend URL)
5. Click **Deploy** — note the URL, e.g. `https://sentinel-backend.onrender.com`

### Step 2 — Deploy the frontend

1. New → **Static Site**
2. Same GitHub repo
3. Configure:
   - **Name**: `sentinel-frontend`
   - **Root Directory**: `Sentinel Application/app/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Environment Variables**:
   - `VITE_API_BASE_URL` = `https://sentinel-backend.onrender.com`
5. Click **Deploy**

> **Note**: Render free tier spins down inactive services after 15 minutes. First request after idle may take ~30 seconds to wake up.

---

## Option C — Railway

Railway offers a generous free tier and supports multi-service projects natively.

### Step 1 — Create a Railway project

1. Go to [railway.app](https://railway.app) → New Project → **Deploy from GitHub repo**
2. Select `IS492-SP26/team-project-deepfakes`

### Step 2 — Configure the backend service

1. Click the auto-created service → **Settings**
2. Set **Root Directory**: `Sentinel Application/app/backend`
3. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Under **Variables**, add your API keys (same as Render above)
5. Railway auto-detects Python and installs `requirements.txt`
6. Note the generated URL, e.g. `https://sentinel-backend.up.railway.app`

### Step 3 — Configure the frontend service

1. New Service → **GitHub Repo** (same repo)
2. Root Directory: `Sentinel Application/app/frontend`
3. Build Command: `npm install && npm run build`
4. Start Command: `npx serve dist -p $PORT`
   - Or set as Static: output directory `dist`
5. Add variable: `VITE_API_BASE_URL` = your Railway backend URL

---

## Environment Variables Reference

Full list of variables for your `.env` (or cloud dashboard):

```env
# === AI Models ===
ANTHROPIC_API_KEY=sk-ant-...           # Claude narrative + taxonomy
GROQ_API_KEY=gsk_...                   # Llama taxonomy (alternative model)

# === Detection & Enrichment ===
DETECTION_API_KEY=your-hive-key        # Hive Moderation API (deepfake detection)
VIRUSTOTAL_API_KEY=your-vt-key         # VirusTotal (optional)
GOOGLE_SAFE_BROWSING_KEY=your-gsb-key  # Google Safe Browsing (optional)

# === Backend Config ===
DATABASE_URL=sqlite:///./data/sentinel.db
SECRET_KEY=change-this-in-production   # Used for internal signing
LOG_TO_FILE=true
LOG_LEVEL=INFO

# === CORS (required for cloud deployments) ===
ALLOWED_ORIGINS=https://your-frontend-url.com
```

---

## Verifying the Deployment

Once running, confirm these endpoints work:

```bash
# Health check
curl https://your-backend-url/health
# Expected: {"status": "ok"}

# Available AI models
curl https://your-backend-url/api/analyze/models
# Expected: {"models": ["claude", "llama"], ...}
```

Then open the frontend URL in your browser and upload a test image — you should see a deepfake verdict, confidence score, and MIT Causal Taxonomy classification.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Automatic classification unavailable" | Check `ANTHROPIC_API_KEY` and `GROQ_API_KEY` in env |
| Upload returns network error | Check `ALLOWED_ORIGINS` includes your frontend URL |
| CORS errors in browser console | Add frontend URL to `ALLOWED_ORIGINS` env var |
| Backend not starting | Run `docker compose logs backend` or check Render/Railway logs |
| Database error on first run | Sentinel auto-creates the DB — ensure `data/` volume is writable |
| Render/Railway first request slow | Free tier cold start — normal, ~30s on first request after idle |
