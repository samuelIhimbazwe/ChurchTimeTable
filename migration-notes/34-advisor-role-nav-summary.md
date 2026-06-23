# Advisor hub role-nav capability slice

## Scope

Migrate `/choir/advisor` — the **last** `role-nav.ts` `HUB_PERMISSIONS` officer hub — to capability gates.

## Legacy permissions (unchanged in HUB_PERMISSIONS fallback)

| Legacy |
|---|
| `choir.reports.view` |
| `discipline:read_all` |
| `event:read` |

## UI capability for hub link

`advisor-hub` — `choir.ops.view@choir`, `choir.discipline.view@choir`, `choir.rehearsal.view@choir`, `choir.voice.view@choir` (via existing aliases).

## Frontend

- `advisor-hub-ui-capability-registry.ts`, `advisor-hub-routes.ts`, `advisor-hub-nav.ts`
- `role-nav.ts` — `/choir/advisor` routes through `legacyAdvisorHubLinkVisible`

## Tests

- `advisor-hub-capability-contract.spec.ts`
- `advisor-hub-nav-page-access-parity.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="advisor-hub"`

## HUB_PERMISSIONS officer hubs — complete

All `CHOIR_POSITION_HUB_LINKS` paths now route through dedicated capability gates when `capabilityCheck` is provided. `HUB_PERMISSIONS` map retained for legacy fallback.

## Deferred

- `/choir/advisor/page.tsx` legacy `hasAnyPermission` snapshot gate
- Scattered `PermissionGate`s across the app
- `NAV_BY_ROLE` role-based sections (not permission-gated)
- Sidebar `composeAdvisorHubAwareNav` (optional augment)
