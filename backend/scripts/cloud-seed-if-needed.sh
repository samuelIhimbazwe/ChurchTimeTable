#!/usr/bin/env bash
# Runtime fallback when build-time seed was skipped (empty DB but SEED_DEMO=true).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${SEED_DEMO:-false}" != "true" ]; then
  exit 0
fi

if node - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const MAIN_CHOIR_ID = '00000000-0000-0000-0000-000000000001';
(async () => {
  const prisma = new PrismaClient();
  try {
    const choir = await prisma.choir.findUnique({ where: { id: MAIN_CHOIR_ID } });
    process.exit(choir ? 0 : 1);
  } finally {
    await prisma.$disconnect();
  }
})();
NODE
then
  echo ">> demo data present — skipping runtime seed"
  exit 0
fi

echo ">> demo data missing — running seeds at startup"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=448}"
export TS_NODE_TRANSPILE_ONLY=true

npx ts-node prisma/seed.ts
npx ts-node prisma/seed-pilot.ts

echo ">> runtime seed complete"
