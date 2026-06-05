#!/usr/bin/env bash
# Render / cloud start: sync schema, optional demo seed, run API.
set -euo pipefail
cd "$(dirname "$0")/.."

echo ">> prisma db push"
npx prisma db push --accept-data-loss

if [ "${SEED_DEMO:-false}" = "true" ]; then
  echo ">> SEED_DEMO=true — running base + pilot seeds"
  npm run prisma:seed
  npm run prisma:seed:pilot
fi

echo ">> starting CMMS API"
exec node dist/main
