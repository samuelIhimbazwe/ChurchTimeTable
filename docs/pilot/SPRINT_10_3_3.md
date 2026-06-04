# Sprint 10.3.3 — Executive Stewardship (Web)

**Status:** COMPLETE  
**Depends on:** Sprint 10.2 reporting APIs, Sprint 10.3.1–10.3.2  
**Next:** Sprint 10.3.4 Admin management screens

## Roles

| Role | Access |
|------|--------|
| President, VP, Treasurer, Family Coordinator | Full executive stewardship (`choir.contribution.view.all`) |
| Member, Family Head/Assistant/Secretary, Choir Secretary | Denied (UI + API 404 on rankings) |
| CHURCH_ADMIN | Denied unless union ministry contribution permissions |

## Routes

| Path | Screen |
|------|--------|
| `/dashboard/stewardship` | Overview — stacked widgets |
| `/dashboard/stewardship/campaigns` | Campaign progress (ACTIVE, COMPLETED) |
| `/dashboard/stewardship/families` | Top families |
| `/dashboard/stewardship/contributors` | Top contributors |
| `/dashboard/stewardship/needs-attention` | Flagged families + backend `reasons[]` |
| `/dashboard/stewardship/adjustments` | Recent adjustments |

Mobile: bottom tab nav on small screens (`lg:hidden`).

## APIs

| Endpoint | Use |
|----------|-----|
| `GET /finance/contributions/totals?scope=choir` | Summary stats, campaigns |
| `GET /finance/contributions/rankings` | Top families/contributors, needs attention |
| `GET /finance/contributions/adjustments/recent` | Adjustment review list |

## Verification

```bash
cd backend && npm run build
cd web && npx playwright test executive-stewardship.spec.ts
```

Pilot logins: `choir.president@church.local`, `choir.treasurer@church.local`, `choir.vice@church.local` (coordinator role in seed if assigned).
