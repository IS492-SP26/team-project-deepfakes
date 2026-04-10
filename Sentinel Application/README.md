# Sentinel — Deepfake Threat Intelligence Platform

A full-stack threat intelligence tool for analyzing deepfakes and Non-Consensual Explicit Imagery (NCEI). Provides structured metadata, confidence scoring, MITRE ATT&CK mapping, and AI-generated analyst narratives powered by Claude.

## Prerequisites

- Python ≥ 3.11
- Node.js ≥ 18
- Anthropic API key → [console.anthropic.com](https://console.anthropic.com)

## Quick Start

### 1. Clone & switch branch
```bash
git clone https://github.com/IS492-SP26/team-project-deepfakes.git
cd team-project-deepfakes
git checkout sentinel-cp3-working
cd "Sentinel Application"
```

### 2. Environment setup
```bash
cp .env.example .env
# Open .env and set: ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Fix PostCSS conflict (one-time)
```bash
rm ../postcss.config.mjs
```

### 4. Start the backend
```bash
cd app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install python-multipart Pillow mutagen
uvicorn main:app --reload --port 8000
```

### 5. Start the frontend (new terminal tab)
```bash
cd app/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Pages

| Route | Description |
|-------|-------------|
| `/` | **Dashboard** — Threat stats, verdict breakdown charts, recent analyses |
| `/analyze` | **Analyze** — Upload media files or submit URLs for deepfake detection |
| `/reports` | **Reports** — Search, filter, and export historical analysis records |

## Stack

- **FastAPI** (Python) — REST API, analysis pipeline, SQLite storage
- **React + Vite** (TypeScript) — Frontend UI
- **Anthropic Claude** (`claude-sonnet-4-20250514`) — AI analyst narratives
- **Hive Moderation API** — Deepfake detection scoring (heuristic fallback if no key)
- **VirusTotal + Google Safe Browsing** — Threat enrichment (optional)
- **Recharts** — Dashboard charts
- **SQLite** — Local analysis history

## API Docs

With the backend running, visit [http://localhost:8000/docs](http://localhost:8000/docs) for the full Swagger UI.
