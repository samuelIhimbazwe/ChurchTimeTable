# Music song notify capability slice

## Scope

Migrate `MusicSongNotifyForm` and `MusicNotifyDeliveryPanel` from legacy `PermissionGate` to unified capability gates.

## Legacy permissions replaced

| Legacy | Capability |
|---|---|
| `choir.announcement.manage` | `choir.announcement.manage@choir` |
| `choir.member.notify` | alias → `choir.announcement.manage@choir` |
| `choir.music.manage` | `choir.music.manage@choir` |

## UI capability

| ID | Caps |
|---|---|
| `music-notify-members` | `choir.announcement.manage@choir`, `choir.music.manage@choir` (any) |

Cross-domain routing via `routeCheck` in `useUiCapability` / `useMusicUiCapability` (comms + music auths).

## Frontend

- `music-ui-capability-registry.ts` (backend mirror)
- `MusicSongNotifyForm.tsx` → `CapabilityGate uiCapability="music-notify-members"`
- `MusicNotifyDeliveryPanel.tsx` → same gate

## Tests

- `music-notify-ui-capability.spec.ts`
- Registry contract via existing `music-capability-contract.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="music-notify|music-capability"`

## Deferred

- `role-nav.ts` `HUB_PERMISSIONS` for `/choir/care`
- HTTP guards on families/reports controllers
- Remaining scattered `PermissionGate`s
