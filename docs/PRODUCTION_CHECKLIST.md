# Production Checklist — Choir MVP

Use before first production deploy and before Protocol MVP begins.

## Infrastructure

- [ ] PostgreSQL provisioned with backups enabled
- [ ] `DATABASE_URL` set (PostgreSQL, not SQLite)
- [ ] `JWT_SECRET` / `JWT_REFRESH_SECRET` rotated from dev defaults
- [ ] `WEB_ORIGIN` set to production domain(s)
- [ ] HTTPS terminated (reverse proxy / load balancer)
- [ ] File storage for song assets configured (S3 or local with auth)

## Database

- [ ] `npx prisma migrate deploy` on staging — success
- [ ] `npm run prisma:seed` on fresh DB — success
- [ ] Staging smoke: login as admin + choir president pilot user

## Application

- [ ] Backend `npm run build` — success
- [ ] Web `npm run build` — success
- [ ] Mobile release build (APK/AAB or TestFlight) — signed

## Quality gates

- [ ] `npm run test:e2e` — 171/171 green
- [ ] Playwright choir specs green against staging
- [ ] [LOCALIZATION_AUDIT.md](./certification/LOCALIZATION_AUDIT.md) — no missing choir keys
- [ ] [SECURITY_REVIEW.md](./certification/SECURITY_REVIEW.md) — reviewed
- [ ] [PILOT_SIGNOFF.md](./certification/PILOT_SIGNOFF.md) — all roles pass

## Post-deploy

- [ ] Monitor error logs 24h
- [ ] Verify welfare notification delivery
- [ ] Verify contribution thank-you (Sprint 10 — unchanged)
- [ ] Choir MVP **LOCKED** — bug fixes only until Protocol MVP

## Rollback trigger

- Data corruption
- RBAC bypass confirmed
- >5% error rate on auth or welfare APIs for 15 minutes

See [release/restore.md](./release/restore.md).
