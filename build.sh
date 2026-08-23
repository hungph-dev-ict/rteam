#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Installing Node.js & Playwright dependencies into local project directory..."
cd files
npm install
export PLAYWRIGHT_BROWSERS_PATH=0
npx playwright install chromium
cd ..
