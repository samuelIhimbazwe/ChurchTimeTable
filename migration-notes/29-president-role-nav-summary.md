# President hub role-nav capability slice

## Scope

Migrate `/choir/president` in legacy `role-nav.ts` `HUB_PERMISSIONS` / officer hub links to capability gates.

## Legacy permissions (unchanged in HUB_PERMISSIONS fallback)

| Legacy |
|---|
| `choir.join.review` |
| `member:manage` |
| `choir.oversight` |
| `choir.operations.manage` |

## UI capability for hub link

`president-hub` — `choir.join.review@choir`, `choir.member.manage@choir`, `choir.ops.view@choir`, `choir.ops.manage@choir`.

## Frontend

- `president-hub-ui-capability-registry.ts`, `president-hub-routes.ts`, `president-hub-nav.ts`
- `role-nav.ts` — `/choir/president` routes through `legacyPresidentHubLinkVisible`
- `Sidebar.tsx` — `composePresidentHubAwareNav` between join and ops compose

## Tests

- `president-hub-capability-contract.spec.ts`
- `president-hub-nav-page-access-parity.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="president-hub"`

## Deferred

- `/choir/vice-president`, `/choir/music-direction`, `/choir/family-coordinator`, `/choir/family-head`, `/choir/advisor`
- President page-level `CapabilityGate`
- Scattered `PermissionGate`s
