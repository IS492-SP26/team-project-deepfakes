#!/bin/bash
# Sentinel — One-command dev start
# Usage: bash scripts/dev.sh

set -e

echo "🛡️  Starting Sentinel..."

# Check .env
if [ ! -f ".env" ]; then
  echo "⚠️  No .env found — copying from .env.example"
  cp .env.example .env
  echo "✏️  Edit .env with your API keys before continuing."
fi

# Create data/logs dirs
mkdir -p data logs

# Backend
echo "🔧 Starting backend..."
cd app/backend
if [ ! -d "venv" ]; then
  python3 -m venv venv
  ./venv/bin/pip install -r requirements.txt --quiet
fi
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ../..

# Frontend
echo "🎨 Starting frontend..."
cd app/frontend
if [ ! -d "node_modules" ]; then
  npm install --silent
fi
npm run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ Sentinel is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
