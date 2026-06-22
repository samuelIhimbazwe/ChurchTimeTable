# Choir reports capability slice

## Capability IDs (v1)

| ID | Legacy alias |
|---|---|
| `choir.report.export@choir` | `report:export` |

View access continues via existing aliases: `choir.reports.view` / `choir.ops.report` → `choir.ops.view@choir`, plus welfare/music/rehearsal view caps on hub UI gate.

## UI capabilities (ops registry)

| ID | Purpose |
|---|---|
| `ops-reports-hub` | Page gate for `/choir/reports` |
| `ops-reports-export` | PDF/CSV export buttons |

## Frontend

- Extended `ops-capability-ids.ts`, `capability-alias-map.ts`, `ops-ui-capability-registry.ts`
- `ops-routes.ts` includes `reports`; `ops-nav.ts` maps reports route
- `useCapability.ts`: route `choir.report.export@choir` through `opsAuth`; cross-domain hub check via `routeCheck`
- `/choir/reports/page.tsx` migrated to `CapabilityGate`

## Tests

- `reports-capability-contract.spec.ts`
- `reports-capability-can.util.spec.ts`
- `ops-nav-page-access-parity.spec.ts` (reports route)
- `ops-capability-contract.spec.ts` (registry sync)

Run: `cd backend && npm test -- --testPathPatterns="reports-capability|ops-nav-page|ops-capability-contract"`

## Deferred

| Item | Notes |
|------|-------|
| `choir-reports.controller.ts` | Legacy `@RequireAnyPermissions` |
| `members/page.tsx` export gate | Separate surface |
| `choir/care/page.tsx` | Mixed legacy gates |

## Next domain candidates

- Care page mixed gates
- `choir-nav.ts` legacy admin tools
