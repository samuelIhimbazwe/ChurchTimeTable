# Vice President hub role-nav capability slice

## Scope

Migrate `/choir/vice-president` in legacy `role-nav.ts` `HUB_PERMISSIONS` / officer hub links to capability gates.

## Legacy permissions (unchanged in HUB_PERMISSIONS fallback)

| Legacy |
|---|
| `choir.ops.view` |
| `choir.ops.manage` |
| `event:write` |

## UI capability for hub link

`vice-president-hub` — `choir.ops.view@choir`, `choir.ops.manage@choir` (`event:write` aliases to ops manage).

## Frontend

- `vice-president-hub-ui-capability-registry.ts`, `vice-president-hub-routes.ts`, `vice-president-hub-nav.ts`
- `role-nav.ts` — `/choir/vice-president` routes through `legacyVicePresidentHubLinkVisible`
- `Sidebar.tsx` — `composeVicePresidentHubAwareNav` wraps president hub compose

## Tests

- `vice-president-hub-capability-contract.spec.ts`
- `vice-president-hub-nav-page-access-parity.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="vice-president-hub"`

## Deferred

- `/choir/music-direction`, `/choir/family-coordinator`, `/choir/family-head`, `/choir/advisor`
- VP page-level `CapabilityGate`
- Scattered `PermissionGate`s
