# Backup Guide

## PostgreSQL

Daily automated backup recommended:

```bash
pg_dump -Fc -h HOST -U USER -d cmms -f cmms-$(date +%F).dump
```

Retain 30 days minimum.

## Application files

- Song asset uploads (if stored on disk)
- Environment secrets (secure vault — not in git)

## SQLite (dev only)

Copy `prisma/dev.db` before schema experiments — **not for production**.

## Verification

Monthly restore test to staging instance using [restore.md](./restore.md).
