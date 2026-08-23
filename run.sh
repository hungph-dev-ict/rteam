#!/bin/bash

# Clean exit for subprocesses
trap "kill 0" EXIT

echo "=========================================================="
echo "      AI Recruitment Harness Platform - Launch System     "
echo "=========================================================="

# Resolve project base directory
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$BASE_DIR"

# 1. Start Python FastAPI Backend
echo "--> Starting FastAPI Backend on http://localhost:8000..."
"$BASE_DIR"/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &

# 2. Wait for backend to start up
sleep 1

# 3. Start React/Vite Frontend
echo "--> Starting Vite React Frontend on http://localhost:5173..."
cd "$BASE_DIR"/frontend
npm run dev -- --port 5173 --host &

# Keep script running and wait for background processes
wait
