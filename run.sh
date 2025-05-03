#!/usr/bin/env bash
# Starts both FastAPI backend and React frontend in parallel.

set -e

# ─── backend ───────────────────────────────────────────────
if [ ! -d "venv" ]; then
    python -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt

# Kill anything already running on port 8000 or 3000 (optional safety)
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start backend in background
uvicorn main:app --reload >backend.log 2>&1 &

# ─── frontend ──────────────────────────────────────────────
cd frontend
npm install
npm start
