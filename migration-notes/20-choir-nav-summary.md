# Choir sidebar nav capability slice

## Scope

Migrate `getComposedChoirNav` admin/treasury/operations sections from legacy permission checks to capability-based UI registries when dashboard context is available.

## Changes

| Area | Before | After |
|---|---|---|
| Admin tools | `adminToolsForPermissions` | `adminToolsForCapabilities` via `ADMIN_HUB_UI_CAPABILITY_REGISTRY` |
| Treasury | `contributionAuth` only | `capabilityCheck` (full router) or legacy `contributionAuth` / permissions |
| Operations | Legacy permissions | `ops-ui` + `roster-ui` registries when `capabilityCheck` provided |
| Wide admin gate | Elevated roles + permission list | Also true when composite UI caps visible via router |

## New shared module

- `web/lib/choir/capability-router.ts` — `routeChoirCapability`, `buildCapabilityRouterFromAuths` (used by `useCapabilityRouter` and nav)

## Frontend wiring

- `getComposedChoirNav(..., capabilityCheck?)` optional 7th arg
- `Sidebar.tsx` passes `useCapabilityRouter` when `choirCtx` is loaded
- Breadcrumbs (`use-translations.ts`) keep legacy fallback (no router)

## Legacy preserved

- `adminToolsForPermissions` (deprecated, internal)
- `CHOIR_WIDE_ADMIN_PERMISSIONS` fallback when no router
- `NAV_BY_ROLE` / `HUB_PERMISSIONS` untouched

## Tests

- `choir-nav-admin-tools.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="choir-nav-admin"`

## Deferred

- `MusicSongNotifyForm` — `choir.member.notify`
- `role-nav.ts` `HUB_PERMISSIONS` for `/choir/care`
- HTTP guards on families/reports controllers
- Remaining scattered `PermissionGate`s
