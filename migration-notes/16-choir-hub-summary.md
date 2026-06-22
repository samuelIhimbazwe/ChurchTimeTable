# Choir hub page capability slice

## Scope

Frontend composite UI capabilities for leadership tiles on `/choir` and `/choir/{choirId}`. No new raw capability IDs.

## UI capabilities

| ID | Legacy gates replaced |
|---|---|
| `hub-new-activity` | `event:write`, `choir.events.manage` |
| `hub-attendance-link` | `attendance:write` |
| `hub-pending-approvals` | `choir.join.review`, `member:manage`, `choir.ops.manage` |
| `hub-welfare-alerts` | `choir.welfare.*`, `discipline:manage` |
| `hub-pending-swaps` | `choir.ops.view/manage`, `event:write` |

## Frontend

- `choir-hub-ui-capability-registry.ts` (backend mirror + web)
- `choir-hub-routes.ts`; auth refresh on hub root paths
- `useChoirHubUiCapability`; wired in `useUiCapability`
- `choir/page.tsx` → `CapabilityGate`

## Tests

- `choir-hub-capability-contract.spec.ts`
- `choir-hub-capability-can.util.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="choir-hub"`

## Deferred

| Item | Notes |
|------|-------|
| `choir-nav.ts` admin tools | Legacy permissions |
| `FamilyAdminPanel` | Legacy family gates |
| `choir/reports/page.tsx` | `report:export` gate |
| `choir/care/page.tsx` | Mixed legacy gates |

## Next domain candidates

- Family coordinator / `FamilyAdminPanel`
- Reports export surfaces
- Care page mixed gates
