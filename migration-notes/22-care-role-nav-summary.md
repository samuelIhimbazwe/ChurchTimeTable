# Care hub role-nav capability slice

## Scope

Migrate `/choir/care` visibility in legacy `role-nav.ts` `HUB_PERMISSIONS` flow to capability-based gates while preserving the permission fallback.

## Legacy permissions (unchanged in HUB_PERMISSIONS)

| Path | Legacy |
|---|---|
| `/choir/care` | `discipline:manage`, `choir.welfare.manage`, `choir.rules.manage` |

## Capability gate

Uses existing composite UI cap **`care-hub`** (welfare + discipline view/manage/review).

## Frontend

- `care-hub-nav.ts` — path filtering, legacy link helper, `composeCareHubAwareNav`
- `role-nav.ts` — `officerHubLinkVisible` routes `/choir/care` through `legacyCareHubLinkVisible`; optional `capabilityCheck` on `getChoirNavForUser` / `getNavForContext`
- `Sidebar.tsx` — `composeCareHubAwareNav` (inside admin hub compose); passes router to `getNavForContext` fallback

## Legacy preserved

- `HUB_PERMISSIONS['/choir/care']` entry intact
- Breadcrumbs / translations keep permission-only fallback

## Tests

- `care-hub-nav-page-access-parity.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="care-hub-nav-page"`

## Deferred

- HTTP guards on families/reports controllers
- Remaining scattered `PermissionGate`s
- Other `HUB_PERMISSIONS` hub paths (president, spiritual, budget, …)
