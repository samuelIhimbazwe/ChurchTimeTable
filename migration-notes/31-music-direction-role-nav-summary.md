# Music direction hub role-nav capability slice

## Scope

Migrate `/choir/music-direction` in legacy `role-nav.ts` `HUB_PERMISSIONS` / officer hub links to capability gates (reuses existing `music-direction-hub` UI capability).

## Legacy permissions (unchanged in HUB_PERMISSIONS fallback)

| Legacy |
|---|
| `choir.music.manage` |
| `choir.rehearsal.manage` |

## UI capability for hub link

`music-direction-hub` — already defined in `music-ui-capability-registry.ts`.

## Frontend

- `music-nav.ts` — `legacyMusicDirectionHubLinkVisible`, `pageAccessForMusicRouteWithCheck`
- `role-nav.ts` — `/choir/music-direction` routes through `legacyMusicDirectionHubLinkVisible`

## Tests

- `music-nav-page-access-parity.spec.ts` (extended with role-nav parity)

Run: `cd backend && npm test -- --testPathPatterns="music-nav-page"

## Deferred

- `/choir/family-coordinator`, `/choir/family-head`, `/choir/advisor`
- Scattered `PermissionGate`s
