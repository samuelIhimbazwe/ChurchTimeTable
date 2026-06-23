# President/VP hub pages and platform PermissionGate migration

## Scope

- Page gates for `/choir/president`, `/choir/vice-president`, and decisions subpages
- Platform UI capability registry (legacy permission bridge for protocol/church/system)
- Migrate scattered `PermissionGate`s outside choir to `CapabilityGate` with `platformUiCapability`

## Choir hub pages

| Page | UI capability |
|------|----------------|
| `/choir/president` | `president-hub` |
| `/choir/president/decisions` | `president-hub` |
| `/choir/vice-president` | `vice-president-hub` |
| `/choir/vice-president/decisions` | `vice-president-hub` |

`useUiCapability` extended for `president-hub` and `vice-president-hub`.

## Platform bridge

- `web/lib/platform/platform-ui-capability-registry.ts` — maps UI capability ids → legacy `requireAnyOf` permission strings
- `web/lib/hooks/usePlatformCapability.ts` — `usePlatformUiCapability`, `usePlatformPermissionCapability`
- `CapabilityGate` — new props `platformUiCapability`, `platformPermission`

Until protocol/church/system scoped capabilities ship on `/auth/me`, effective permissions from JWT + dashboard context drive visibility (same behavior as `PermissionGate`).

## Migrated areas

- All protocol dashboard pages/components (teams, claims, treasury, admin, reports, etc.)
- Church schedule, facilities, service requests, announcements, timetable
- System users/import/page, members, global announcements
- `MinistryFeatureFlags`

## Tests

- `backend/src/common/platform/platform-ui-capability.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="platform-ui-capability|president-hub"`

## Deferred

- Replace platform permission bridge with real scoped capabilities (protocol/church/system auth blobs)
- Mobile parity for platform gates
