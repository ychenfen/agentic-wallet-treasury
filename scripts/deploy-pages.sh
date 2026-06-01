#!/usr/bin/env bash
#
# Deploy the dashboard to GitHub Pages (gh-pages branch).
#
# IMPORTANT: the site is a PROJECT page served at /agentic-wallet-treasury/, so
# the build MUST use that base path. A root base ("/") makes index.html request
# /assets/... which 404s on a project page, so the React app never boots and the
# public dashboard shows a blank screen. Always deploy through this script.
#
# Usage:  bash scripts/deploy-pages.sh
#
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
BASE_PATH="${VITE_BASE_PATH:-/agentic-wallet-treasury/}"

cd "$REPO"
echo "[deploy] building with base ${BASE_PATH}"
VITE_BASE_PATH="$BASE_PATH" npm run build -w @clawdao/web

# Sanity check: index.html must reference the project base, not root.
if ! grep -q "${BASE_PATH}assets/" "$REPO/apps/web/dist/index.html"; then
  echo "[deploy] ERROR: dist/index.html does not use base ${BASE_PATH}. Aborting."
  exit 1
fi

WT="$(mktemp -d)"
git fetch origin gh-pages
git worktree add --detach "$WT" origin/gh-pages
rsync -a --delete --exclude='.git' "$REPO/apps/web/dist/" "$WT/"
cd "$WT"
git add -A
if git diff --cached --quiet; then
  echo "[deploy] no changes to publish"
else
  git commit -q -m "Deploy dashboard"
  git push origin HEAD:gh-pages
fi
cd "$REPO"
git worktree remove --force "$WT"
echo "[deploy] done — live in ~1-2 min: https://ychenfen.github.io/agentic-wallet-treasury/"
