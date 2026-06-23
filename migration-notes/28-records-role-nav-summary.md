# Records hub role-nav capability slice

## Scope

Migrate `/choir/records` in legacy `role-nav.ts` `HUB_PERMISSIONS` / officer hub links to capability gates (mirror care/budget/spiritual hubs).

## Legacy permissions (unchanged in HUB_PERMISSIONS fallback)

| Legacy |
|---|
| `choir.records.view` |
| `audit:read` |
| `choir.document.manage` |

## UI capability for hub link

`records-hub` — `choir.document.view@choir`, `choir.document.manage@choir`, `choir.ops.view@choir`.

## Legacy alias added

| Legacy | Capability |
|---|---|
| `choir.records.view` | `choir.document.view@choir`, `choir.ops.view@choir` |

## Frontend

- `records-hub-ui-capability-registry.ts`, `records-hub-routes.ts`, `records-hub-nav.ts`
- `role-nav.ts` — `/choir/records` routes through `legacyRecordsHubLinkVisible`
- `Sidebar.tsx` — `composeRecordsHubAwareNav` in compose chain

## Tests

- `records-hub-capability-contract.spec.ts`
- `records-hub-nav-page-access-parity.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="records-hub"`

## Deferred

- `/choir/records` page-level `CapabilityGate` (no gate on page yet)
- Other `HUB_PERMISSIONS` hub paths: `/choir/president`, `/choir/family-head`, …
- `NAV_BY_ROLE` secretary section (role-based, not permission-gated)
- Scattered `PermissionGate`s
