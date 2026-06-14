#!/usr/bin/env bash
# Render build: ensure PostgreSQL provider, generate client, apply migrations.
# Falls back to db push for demo DBs created without migration history (P3005).
set -euo pipefail
cd "$(dirname "$0")/.."

ensure_postgresql_for_cloud() {
  local url="${DATABASE_URL:-}"
  if [[ "$url" == file:* ]]; then
    return 0
  fi
  if grep -q 'provider = "sqlite"' prisma/schema.prisma; then
    echo ">> Cloud DATABASE_URL is not SQLite — switching schema provider to postgresql"
    sed -i.bak 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
    rm -f prisma/schema.prisma.bak
  fi
}

ensure_postgresql_for_cloud

echo ">> prisma generate"
npx prisma generate

if npx prisma migrate deploy; then
  echo ">> prisma migrate deploy OK"
else
  echo ">> migrate deploy failed — using db push (demo / legacy Neon schema)"
  npx prisma db push --accept-data-loss --skip-generate
fi
