# Family head hub role-nav capability slice

## Scope

Migrate `/choir/family-head` in legacy `role-nav.ts` `HUB_PERMISSIONS` / officer hub links to capability gates.

## Legacy permissions (unchanged in HUB_PERMISSIONS fallback)

| Legacy |
|---|
| `choir.family.view` |
| `family:view` |
| `attendance.mark` |

## Legacy aliases added

| Legacy | Capability |
|---|---|
| `choir.family.view` | `choir.contribution.view@family` |
| `family:view` | `choir.contribution.view@family` |

(`attendance.mark` already aliases to `choir.ops.attendance@choir`, `choir.member.view@choir`.)

## UI capability for hub link

`family-head-hub` — `choir.contribution.view@family`, `choir.contribution.approve@family`, `choir.ops.attendance@choir`, `choir.member.view@choir`.

## Frontend

- `contribution-ui-capability-registry.ts` — new `family-head-hub` entry
- `family-routes.ts` — `family-head` tail
- `family-nav.ts` — `legacyFamilyHeadHubLinkVisible`
- `role-nav.ts` — `/choir/family-head` routes through capability gate
- `capability-can.ts` — scoped `@family` caps match for nav when `scopeId` omitted (any family office)

## Tests

- `family-capability-contract.spec.ts` (extended)
- `family-capability-can.util.spec.ts` (extended)
- `family-nav-page-access-parity.spec.ts` (extended)

Run: `cd backend && npm test -- --testPathPatterns="family-nav-page|family-capability"

## Deferred

- `/choir/advisor` (last HUB_PERMISSIONS hub)
- `/choir/family-head/page.tsx` legacy `PermissionGate` import cleanup
- Scattered `PermissionGate`s
