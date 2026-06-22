# Admin hub capability slice

## Scope

Frontend-only composite UI capabilities for `/choir/admin`, `ChoirAdminHub`, and executive governance tiles. No new raw capability IDs — tiles compose existing `choir.*@choir` grants from migrated domains.

## UI capabilities

| ID | Purpose |
|---|---|
| `admin-hub` | Page gate for `/choir/admin` |
| `admin-join-link` | Join requests quick link |
| `admin-roster-link` | Roster quick link |
| `admin-families-link` | Families structure quick link |
| `admin-roles-link` | Position roles quick link |
| `admin-public-profile-link` | Public profile quick link |
| `admin-settings-link` | Choir settings quick link |
| `admin-service-requests-link` | Church service requests quick link |
| `admin-executive-join-card` | President/VP join decisions card |
| `admin-executive-roles-link` | President/VP position roles link |

## Frontend

- `admin-hub-ui-capability-registry.ts` (backend mirror + web)
- `admin-hub-routes.ts`, `admin-hub-nav.ts`
- `useCapabilityRouter` + `useAdminHubUiCapability`; `useUiCapability` routes admin-hub UI ids
- `composeAdminHubAwareNav` outermost in `Sidebar.tsx`
- `ChoirAdminHub.tsx`, `ChoirExecutiveHubContent.tsx`, `/choir/admin/page.tsx` migrated to `CapabilityGate`

## Tests

- `admin-hub-capability-contract.spec.ts`
- `admin-hub-nav-page-access-parity.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="admin-hub"`

## Deferred

| Item | Notes |
|------|-------|
| `choir/page.tsx` leader KPI strips | Legacy `PermissionGate` |
| `choir-nav.ts` `adminToolsForPermissions` | Legacy permission checks |
| `FamilyAdminPanel` | Legacy family manage gates |
| Service prep / scheduling tiles on admin hub | Ungated (unchanged) |

## Next domain candidates

- `choir/page.tsx` hub tiles
- Reports / intelligence surfaces
- Family coordinator / family admin panels
