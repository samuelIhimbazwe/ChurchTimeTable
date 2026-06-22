# Members roster capability slice

## Capability IDs (v1)

| ID | Purpose |
|---|---|
| `choir.member.view@choir` | View choir roster |
| `choir.member.manage@choir` | Shared with join/sponsor — deactivate members, roster actions |

## Backend

- `roster-capability-ids.ts`, `role-roster-capability-bundles.ts`, `roster-ui-capability-registry.ts`
- `roster-capability-resolver.service.ts`, `roster-capability.module.ts`
- Aliases: `member:read` → `member.view@choir`; `choir.ops.view`, `choir.oversight`, `attendance.mark` also grant view; `choir.operations.manage` also grants `member.manage@choir`
- `rosterAuth` on `/auth/me?choirId=` and choir dashboard context
- `ChoirRosterAccessService` + `choir-members.service.ts` migrated

## Frontend

- Mirror UI registry, `roster-routes.ts`, `roster-nav.ts`
- `useRosterAuth`; `choir.member.view@choir` routed in `useCapability.ts`; `member.manage` checks join, sponsor, and roster auth
- `/choir/members` gated via `roster-hub`; manage actions use `roster-manage`

## Tests

- `roster-capability-can.util.spec.ts`
- `roster-capability-contract.spec.ts`
- `roster-nav-page-access-parity.spec.ts`

## Deferred

| Item | Notes |
|------|-------|
| `choir-nav.ts` legacy roster in Operations | Filtered by `composeRosterAwareNav` |
| Assign/revoke position endpoints | Still controller-level legacy guards |
| Church-wide `/members` | Out of choir scope |

## Next domain candidates

- Meetings / announcements
- Voice sections
