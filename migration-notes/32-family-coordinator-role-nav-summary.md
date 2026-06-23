# Family coordinator hub role-nav capability slice

## Scope

Migrate `/choir/family-coordinator` in legacy `role-nav.ts` `HUB_PERMISSIONS` / officer hub links to capability gates (reuses existing `family-coordinator-hub` UI capability).

## Legacy permissions (unchanged in HUB_PERMISSIONS fallback)

| Legacy |
|---|
| `choir.family.manage` |
| `family:manage` |

Both alias to `choir.contribution.oversight@choir`.

## UI capability for hub link

`family-coordinator-hub` — already in `contribution-ui-capability-registry.ts`.

## Frontend

- `family-nav.ts` — `legacyFamilyCoordinatorHubLinkVisible`, route check helpers
- `role-nav.ts` — `/choir/family-coordinator` routes through capability gate

## Tests

- `family-nav-page-access-parity.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="family-nav-page"

## Deferred

- `/choir/family-head`, `/choir/advisor`
- `composeFamilyAwareNav` in Sidebar (optional augment path)
- Scattered `PermissionGate`s
