#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Installing Node.js & Playwright dependencies for automation..."
cd files
npm install
npx playwright install chromium
cd ..
