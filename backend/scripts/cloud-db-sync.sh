#!/usr/bin/env bash
# Render build: apply migrations when possible; fall back to db push for demo DBs
# that were created with db push (P3005 — schema not empty, no migration history).
set -euo pipefail
cd "$(dirname "$0")/.."

if npx prisma migrate deploy; then
  echo ">> prisma migrate deploy OK"
else
  echo ">> migrate deploy failed — using db push (demo / legacy Neon schema)"
  npx prisma db push --accept-data-loss --skip-generate
fi
