# Meetings / announcements capability slice

## Capability IDs (v1)

| ID | Purpose |
|---|---|
| `choir.announcement.view@choir` | List announcements, delivery stats, music-notify delivery |
| `choir.announcement.manage@choir` | Create and publish targeted announcements |
| `choir.meeting.view@choir` | View choir meetings and action-item reports |
| `choir.meeting.manage@choir` | Schedule choir meetings |

## Backend

- `comms-capability-ids.ts`, `role-comms-capability-bundles.ts`, `comms-ui-capability-registry.ts`
- `comms-capability-resolver.service.ts`, `comms-capability.module.ts`
- Aliases: `choir.announcement.manage`, `choir.meeting.manage`, `announcement:write`, `choir.events.manage`
- `commsAuth` on `/auth/me?choirId=` and choir dashboard context
- `ChoirCommsAccessService` + `choir-announcements.service.ts`, `choir-meetings.service.ts` migrated

## Frontend

- Mirror UI registry, `comms-routes.ts`, `comms-nav.ts`
- `useCommsAuth`; `choir.announcement.*` / `choir.meeting.*` routed in `useCapability.ts`
- `/choir/announcements` → `comms-announcements-hub`; `/choir/meetings` → `comms-meetings-hub`
- Manage actions use `comms-announcements-manage` / `comms-meetings-manage`

## Tests

- `comms-capability-can.util.spec.ts`
- `comms-capability-contract.spec.ts`
- `comms-nav-page-access-parity.spec.ts`

## Deferred

| Item | Notes |
|------|-------|
| `choir-nav.ts` / records page links | Filtered by `composeCommsAwareNav` |
| Documents / uniforms / equipment | Separate ops slice |
| `MusicSongNotifyForm` PermissionGate | Uses legacy `choir.member.notify` — unchanged |

## Next domain candidates

- Voice sections
- Documents / logistics equipment
