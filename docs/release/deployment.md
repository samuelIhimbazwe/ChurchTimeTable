# Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Optional: Docker for Postgres (`docker compose up -d`)

## Backend

```bash
cd backend
cp .env.example .env   # set DATABASE_URL, JWT secrets, WEB_ORIGIN
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
npm run start:prod
```

## Web

```bash
cd web
cp .env.example .env.local   # NEXT_PUBLIC_API_URL
npm ci
npm run build
npm run start
```

## Mobile

```bash
cd mobile
flutter pub get
flutter build apk --release
```

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL in production |
| `JWT_SECRET` | Yes | Strong random string |
| `WEB_ORIGIN` | Yes | Comma-separated allowed origins |

## Health check

`GET /api/v1/health` (if exposed) or login smoke test.
