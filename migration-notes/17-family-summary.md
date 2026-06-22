# Family coordinator / families capability slice

## Capability mapping

| Legacy | Capability |
|---|---|
| `choir.family.manage` | `choir.contribution.oversight@choir` |
| `family:manage` | `choir.contribution.oversight@choir` (new alias) |

## UI capabilities (in contribution registry)

| ID | Purpose |
|---|---|
| `family-manage` | Assign heads, add/remove/move members |
| `family-hub` | View families pages (structure or full) |
| `family-coordinator-hub` | Family coordinator position hub |

## Frontend

- Extended `contribution-ui-capability-registry.ts` (backend + web)
- `family-routes.ts`; auth refresh on family routes
- `FamilyAdminPanel`, `/choir/families`, `/choir/admin/families`, `/choir/family-coordinator` migrated

## Tests

- `family-capability-contract.spec.ts`
- `family-capability-can.util.spec.ts`
- `contribution-capability-contract.spec.ts` (registry sync)

Run: `cd backend && npm test -- --testPathPatterns="family-capability|contribution-capability-contract"`

## Deferred

| Item | Notes |
|------|-------|
| `families.controller.ts` | Legacy `@RequirePermissions` at HTTP layer |
| `choir-nav.ts` family admin tools | Legacy permissions |
| `family-head/page.tsx` | Legacy gates |

## Next domain candidates

- `choir/reports` export gate
- `choir/care/page.tsx` mixed gates
