# Finance stewardship (Sprint 8)

Ministry-scoped finance — not global accounting. Visibility derives from **scoped permissions** and **OperationalScopeContext**, not `report:export` or generic admin rights.

## Authority model

| Ministry | View | Manage | Approve | Oversight |
|----------|------|--------|---------|-----------|
| Choir | `choir.finance.view` | `choir.finance.manage` | `choir.finance.approve` | `ministry.finance.oversight` |
| Protocol | `protocol.finance.view` | `protocol.finance.manage` | `protocol.finance.approve` | `protocol.oversight`, `ministry.finance.oversight` |

Committee assignments (e.g. `protocol_treasurer`) compose effective permissions via `permissionsJson`.

## API (backend)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/finance/stewardship/analytics?ministryScope=CHOIR\|PROTOCOL` | Scoped KPIs, budgets, alerts |
| GET | `/finance/contributions/mine` | Member-only contribution history |
| POST | `/finance/transactions` | Requires `ministryScope` on body |
| PATCH | `/finance/transactions/:id/approve` | Scoped approval |
| PATCH | `/finance/transactions/:id/receipt` | Attach `receiptUrl` evidence |

Super-admin finance audit: `GET /finance/admin/audit-summary` (audited).

## Web

- **Treasurer route:** `/[locale]/dashboard/finance`
- **Member route:** `/[locale]/dashboard/finance/my-contributions` (authenticated members only)
- **Permissions:** `FINANCE_ACCESS_PERMISSIONS` in `governance-permissions.ts` (treasurer); members need no finance claims for “mine”
- **Data:** `fetchFinanceStewardshipAnalytics()` / `fetchMyContributions()`

## Exports (Sprint 8 completion patch)

| Endpoint | Actor |
|----------|--------|
| `GET /finance/export/csv?ministryScope&from&to` | Scoped treasurer / oversight |
| `GET /finance/export/pdf?...` | Same |
| `GET /finance/contributions/mine/export/csv` | Current member only |
| `GET /finance/contributions/mine/export/pdf` | Current member only |

All exports write audit log entries (`FINANCE_EXPORT_*`, `MEMBER_CONTRIBUTIONS_EXPORT_*`).

## Mobile

- Finance screen uses `/finance/stewardship/analytics` (same scope rules as web).
- Offline receipt queue: reuse existing sync pipeline (future hardening).

## Pilot logins

Password: `Pilot@123`

| Role | Email |
|------|-------|
| Choir treasurer | `choir.treasurer@church.local` |
| Protocol treasurer (committee) | `protocol.treasurer@church.local` |
| Protocol president (oversight) | `protocol.president@church.local` |

Seed: `npx ts-node prisma/seed.ts` then `npx ts-node prisma/seed-pilot.ts`.

## Privacy

- Treasurers see only ministries in their operational scope.
- Members see only `/finance/contributions/mine`.
- Presidents with `executiveSummaryOnly` get summarized analytics, not full transaction detail.

## Tests

- Unit: `backend/src/common/governance/finance-scope.util.spec.ts`
- E2E: `web/tests/finance-stewardship.spec.ts`
