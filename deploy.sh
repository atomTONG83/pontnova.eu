#!/usr/bin/env bash
set -euo pipefail

# Manual fallback deploy for pontnova.eu.
# The canonical update path is the atom-ip-sentinel backend deploy hub.

PROJECT_NAME="${CF_PAGES_PROJECT:-pontnova}"
BRANCH="${CF_PAGES_BRANCH:-main}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$ROOT_DIR/.cloudflare-pages/$PROJECT_NAME"

PUBLIC_PATHS=(
  "index.html"
  "eu_ip_sentinel.html"
  "eu_ip_sentinel_en.html"
  "ae-trace.html"
  "workload.html"
  "atom_ip_workload.html"
  "workbench"
  "_worker.js"
  "robots.txt"
  "eu_ip_sentinel_assets"
)

cd "$ROOT_DIR"

if [[ "${SKIP_SYNC:-0}" != "1" ]]; then
  python3 scripts/sync_eu_ip_sentinel_snapshot.py
fi

rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

for path in "${PUBLIC_PATHS[@]}"; do
  if [[ ! -e "$path" ]]; then
    echo "Missing public path: $path" >&2
    exit 1
  fi
  mkdir -p "$DEPLOY_DIR/$(dirname "$path")"
  cp -R "$path" "$DEPLOY_DIR/$path"
done

if [[ ! -f "$DEPLOY_DIR/404.html" ]]; then
  printf '%s\n' \
    '<!doctype html>' \
    '<html lang="en">' \
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 Not Found</title></head>' \
    '<body><main><h1>404 Not Found</h1><p>The requested page is not available.</p><p><a href="/">Return to Pontnova</a></p></main></body>' \
    '</html>' > "$DEPLOY_DIR/404.html"
fi

npx wrangler pages deploy "$DEPLOY_DIR" \
  --project-name "$PROJECT_NAME" \
  --branch "$BRANCH" \
  --skip-caching \
  --commit-dirty \
  "$@"
