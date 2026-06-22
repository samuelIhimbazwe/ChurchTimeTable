# Join requests capability slice

## Capability IDs (v1)

| ID | Purpose |
|---|---|
| `choir.join.review@choir` | Review singer join requests |
| `choir.member.manage@choir` | Assign positions / full member management on approval |

## Backend

- `join-capability-ids.ts`, `role-join-capability-bundles.ts`, `join-ui-capability-registry.ts`
- `join-capability-resolver.service.ts`, `join-capability.module.ts`
- Aliases: `choir.join.review`, `member:manage`; `choir.operations.manage` also grants `join.review@choir`
- `joinAuth` on `/auth/me?choirId=` and choir dashboard context
- `ChoirJoinAccessService` + `choir-join-requests.service.ts` migrated (VP delegation logic preserved)

## Frontend

- Mirror UI registry, `join-routes.ts`, `join-nav.ts`
- `useJoinAuth` / hook routing for `choir.join.*` and `choir.member.manage@choir`
- `composeJoinAwareNav` in sidebar
- `/choir/join-requests`: review actions use `join-requests-review` (page stays open to applicants)

## Tests

- `join-capability-can.util.spec.ts`
- `join-capability-contract.spec.ts`
- `join-nav-page-access-parity.spec.ts`

## Deferred

| Item | Notes |
|------|-------|
| `/choir/president/decisions` | Redirect target for reviewers; legacy gates |
| Sponsor requests tab | `choir.sponsor.review` — separate domain |
| `ChoirAdminHub`, `choir/page.tsx` tiles | Legacy PermissionGate |
| `choir-nav.ts` join section | Legacy permission checks |

## Next domain candidates

- Music / rehearsal
- Sponsor requests
- Members roster (`member:read` / roster view)
