# Care hub capability slice

## Scope

Composite UI capabilities for `/choir/care` spanning welfare, discipline, logistics (documents), and comms.

## Legacy aliases added

| Legacy | Capability |
|---|---|
| `choir.rules.manage` | `choir.document.manage@choir`, `choir.discipline.manage@choir` |
| `choir.member.notify` | `choir.announcement.manage@choir` |

## UI capabilities

| ID | Legacy gates replaced |
|---|---|
| `care-hub` | Page gate (welfare/discipline access) |
| `care-command-home` | `choir.welfare.view/manage` |
| `care-rules-manage` | `choir.rules.manage`, `choir.document.manage`, `discipline:manage` |
| `care-notices-send` | `choir.member.notify`, `choir.announcement.manage`, `discipline:manage` |

Discipline and welfare tabs already used `discipline-manage` / `welfare-manage` (unchanged).

## Frontend

- `care-hub-ui-capability-registry.ts` (backend mirror + web)
- `care-hub-routes.ts`; auth refresh on care routes
- `useCareHubUiCapability`; wired in `useUiCapability` via `routeCheck`
- `/choir/care/page.tsx` fully migrated off `PermissionGate`

## Tests

- `care-hub-capability-contract.spec.ts`
- `care-hub-capability-can.util.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="care-hub"`

## Deferred

| Item | Notes |
|------|-------|
| `choir-nav.ts` legacy admin tools | Permission-based nav |
| `MusicSongNotifyForm` | Legacy member.notify gate |
| `role-nav.ts` HUB_PERMISSIONS for `/choir/care` | Legacy |

## Next domain candidates

- `choir-nav.ts` capability-aware admin tools
- Remaining scattered `PermissionGate` on choir surfaces
