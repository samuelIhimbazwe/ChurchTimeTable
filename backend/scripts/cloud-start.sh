#!/usr/bin/env bash
# Render runtime: no schema sync here (done at build). Start API only.
set -euo pipefail
cd "$(dirname "$0")/.."

echo ">> checking demo seed (if needed)"
bash scripts/cloud-seed-if-needed.sh

echo ">> starting CMMS API"
exec node dist/main
