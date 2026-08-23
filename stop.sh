#!/bin/bash
# Script to stop the recruiting platform backend (port 8000) and frontend (port 5173)

BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$BASE_DIR"

echo "=========================================================="
echo "    Stopping AI Recruitment Platform Services...         "
echo "=========================================================="

PIDS=$(lsof -t -i:8000 -i:5173)

if [ -z "$PIDS" ]; then
  echo "--> No processes found running on ports 8000 or 5173."
else
  echo "--> Killing processes on ports 8000 & 5173 (PIDs: $PIDS)..."
  kill -9 $PIDS
  echo "--> Services stopped successfully."
fi
echo "=========================================================="
