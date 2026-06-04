# Sprint 10.3.2 — Family Leadership Workspace (Web)

**Status:** COMPLETE (UI + permission wiring)  
**Depends on:** Sprint 10.2 contribution governance (frozen)  
**Next:** Sprint 10.3.3 Executive Stewardship

## Scope delivered

Operational web workspace for family leadership roles:

| Role | Approve / reject | View inbox, totals, rankings, goals |
|------|------------------|-------------------------------------|
| Family Head | Yes | Yes |
| Assistant Head | Yes when `delegationEnabled` | Yes |
| Assistant Head (no delegation) | No | Yes (view only) |
| Family Secretary | No | Yes (view only) |

Plain members without a leadership role see **Family workspace unavailable**.

## Routes

| Path | Purpose |
|------|---------|
| `/dashboard/family/contributions` | Hub — stats, quick links, rankings preview, goals, activity |
| `/dashboard/family/contributions/pending` | Pending inbox |
| `/dashboard/family/contributions/[id]` | Review detail + approve/reject modals |
| `/dashboard/family/rankings` | Family contributor rankings |
| `/dashboard/family/goals` | Campaign progress for family |

## APIs consumed (no new governance rules)

- `GET /finance/contributions/family/context`
- `GET /finance/contributions/family/inbox` (`status` query: `SUBMITTED`, `CONFIRMED`, …)
- `POST /finance/contributions/:id/family/approve`
- `POST /finance/contributions/:id/family/reject`
- `GET /finance/contributions/totals?familyId=`
- `GET /finance/contributions/rankings?familyId=`
- `GET /finance/contributions/:id` (leadership scope via member service)

## Pilot data

After `npm run prisma:seed:pilot`:

- Family `PILOT-A` — Pilot Family Alpha
- `member1@church.local` — HEAD
- `member2@church.local` — SECRETARY (view-only API/UI)

## Verification

```bash
cd backend && npm run build
cd web && npx playwright test family-contributions.spec.ts
```

Backend Sprint 10 regression: `npm run test:e2e -- --testPathPatterns="sprint-10"` (96 tests).

## Out of scope (10.3.3)

Executive stewardship for President, VP, Treasurer, Family Coordinator — choir totals, campaigns, needs attention, adjustment review.
