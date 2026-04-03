# Sentinel — Deepfake Threat Intelligence Platform
## Installation & Setup Guide

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| Python | ≥ 3.11 |
| npm | ≥ 9.x |
| pip | ≥ 23.x |
| Git | ≥ 2.x |

---

## 1. Clone the Repository

```bash
git clone https://github.com/IS492-SP26/team-project-deepfakes.git
cd team-project-deepfakes
git checkout Frontend-Sentinel
cd "Sentinel Application"
```

---

## 2. Environment Configuration

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your API keys (see `.env.example` for all required vars).

---

## 3. Backend Setup (FastAPI)

```bash
cd app/backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Swagger docs: `http://localhost:8000/docs`

---

## 4. Frontend Setup (React + Vite)

```bash
cd app/frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 5. Run with Docker (Recommended for Demo)

```bash
# From the repo root
docker-compose up --build
```

Services:
- Frontend → `http://localhost:5173`
- Backend API → `http://localhost:8000`
- SQLite DB → `./data/sentinel.db` (auto-created)

---

## 6. Run Tests

```bash
# Unit tests (backend)
cd app/backend && pytest tests/ -v

# Unit tests (frontend)
cd app/frontend && npm run test

# End-to-end tests
cd tests/e2e && npm install && npx playwright test
```

---

## 7. One-Command Dev Start

```bash
bash scripts/dev.sh
```

---

## Troubleshooting

- **CORS errors**: Ensure `FRONTEND_ORIGIN` in `.env` matches your frontend URL.
- **API key errors**: Double-check `.env` — the app won't start if required keys are missing.
- **Port conflicts**: Change `PORT` in `.env` or stop conflicting services.

---

## Production Deployment

See `docs/deployment.md` for Render / Railway / Vercel deployment guides.

## Known Setup Issue — PostCSS
If you see a `Cannot find module 'tailwindcss'` error when running the frontend,
delete the conflicting PostCSS config in the parent folder:

    rm "Sentinel Application/postcss.config.mjs"

Then re-run `npm run dev`.
