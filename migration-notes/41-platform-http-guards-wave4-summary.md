# Platform HTTP guards — wave 4

## Scope

Complete protocol read surface, governance protocol committee routes, sync admin, and remaining admin/setup routes.

## Registry additions

- **`protocol-view`** — baseline protocol read access (view, manage, oversight, team ops, rankings, etc.)
- **`admin-roles-manage`** — now includes `admin.roles.view@platform`
- Legacy aliases: `member:read`, `member.portal.view` → `protocol.view@ministry`

## Migrated controllers

| Controller | Capabilities |
|------------|--------------|
| `protocol.controller` | All routes now `@RequireUiCapability` (no legacy `@RequirePermissions`) |
| `governance.controller` | Protocol committee/team routes |
| `sync.controller` | `admin-sync-manage` (was unguarded) |
| `setup.controller` | `admin-settings-manage` on configuration PATCH |
| `deployment.controller` | Reminders dashboard → `admin-settings-manage` |
| `pilot-ready.controller` | Permission audit, simulations, notification rules |
| `auth-ux.controller` | Church branding PATCH → `admin-settings-manage` |

## Deferred

- Choir committee routes in `governance.controller` (choir-scoped, not platform)
- Mixed pilot/setup routes (readiness + intelligence view combos)
- `ministry-platform.controller`
- Remove web legacy permission fallback

## Tests

```bash
cd backend && npm test -- --testPathPatterns="platform-http-access|platform-ui-capability-contract|platform-capability"
cd backend && npm run build
```
