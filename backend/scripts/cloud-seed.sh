#!/usr/bin/env bash
# Run during Render build (more RAM than runtime). Skipped when SEED_DEMO is not true.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${SEED_DEMO:-false}" != "true" ]; then
  echo ">> SEED_DEMO not true — skipping cloud seed"
  exit 0
fi

echo ">> SEED_DEMO=true — syncing schema and running seeds"
npx prisma db push --accept-data-loss --skip-generate

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"
export TS_NODE_TRANSPILE_ONLY=true

echo ">> prisma:seed"
npx ts-node prisma/seed.ts

echo ">> prisma:seed:pilot"
npx ts-node prisma/seed-pilot.ts

echo ">> cloud seed complete"
