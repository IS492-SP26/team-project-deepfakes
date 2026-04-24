# Sentinel — Installation & Setup Guide

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| Python | ≥ 3.11 |
| npm | ≥ 9.x |
| Git | ≥ 2.x |

---

## 1. Clone the Repository

```bash
git clone https://github.com/IS492-SP26/team-project-deepfakes.git
cd team-project-deepfakes/Sentinel\ Application
```

---

## 2. Environment Configuration

```bash
cp .env.example .env
```

Open `.env` and fill in at minimum:

| Key | Where to get it |
|-----|----------------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `GROQ_API_KEY` | https://console.groq.com (free tier) |
| `DETECTION_API_KEY` | https://thehive.ai |

The rest of the defaults work for local development.

---

## 3. Backend (FastAPI)

```bash
cd app/backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

Leave this terminal running and open a new one for the frontend.

---

## 4. Frontend (React + Vite)

```bash
cd app/frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 5. Run with Docker (Alternative)

```bash
docker-compose up --build
```

- Frontend → http://localhost:5173
- Backend → http://localhost:8000

---

## Troubleshooting

- **CORS errors** — make sure `FRONTEND_ORIGIN=http://localhost:5173` is set in `.env`
- **API key errors** — the backend will fail to start if required keys are missing; check the terminal output
- **Port conflicts** — kill any process on 8000 or 5173, or change the ports in `.env`
- **`Cannot find module 'tailwindcss'`** — delete `Sentinel Application/postcss.config.mjs` and re-run `npm run dev`
