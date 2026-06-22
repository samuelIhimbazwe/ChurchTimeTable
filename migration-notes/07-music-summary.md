# Music / rehearsal capability slice

## Capability IDs (v1)

| ID | Purpose |
|---|---|
| `choir.music.view@choir` | Browse music library |
| `choir.music.manage@choir` | Create/edit songs and assets |
| `choir.rehearsal.view@choir` | View rehearsal plans, attendance, dashboards |
| `choir.rehearsal.manage@choir` | Upsert plans, record rehearsal attendance |

## Backend

- `music-capability-ids.ts`, `role-music-capability-bundles.ts`, `music-ui-capability-registry.ts`
- `music-capability-resolver.service.ts`, `music-capability.module.ts`
- Aliases: `choir.music.view/manage`, `choir.rehearsal.view/manage` (rehearsal aliases also map to ops caps where applicable); `event:read` → `choir.rehearsal.view@choir`
- `musicAuth` on `/auth/me?choirId=` and choir dashboard context
- `ChoirMusicAccessService` + `music.service.ts`, `rehearsals.service.ts` migrated

## Frontend

- Mirror UI registry, `music-routes.ts`, `music-nav.ts`
- `useMusicAuth`; `choir.music.*` / `choir.rehearsal.*` routed in `useCapability.ts`
- Pages `/choir/music`, `/choir/music/[id]`, `/choir/music-direction` gated via `music-library-hub` / `music-direction-hub`
- Manage actions on music-direction use `music-direction-manage`

## Tests

- `music-capability-can.util.spec.ts`
- `music-capability-contract.spec.ts`
- `music-nav-page-access-parity.spec.ts`

## Deferred

| Item | Notes |
|------|-------|
| `choir-nav.ts` Quick links music library | Filtered by `composeMusicAwareNav` when `musicAuth` present |
| Voice sections route | Separate slice |
| Legacy `PermissionGate` elsewhere | Unchanged outside music-direction |

## Next domain candidates

- Members roster
- Meetings / announcements
