#!/usr/bin/env bash
# Render / cloud start: sync schema, optional demo seed, run API.
set -euo pipefail
cd "$(dirname "$0")/.."

echo ">> prisma db push (skip generate — already done at build)"
npx prisma db push --accept-data-loss --skip-generate

bash scripts/cloud-seed-if-needed.sh

echo ">> starting CMMS API"
exec node dist/main
