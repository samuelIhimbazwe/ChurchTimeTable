# Sponsor requests capability slice

## Capability IDs (v1)

| ID | Purpose |
|---|---|
| `choir.sponsor.review@choir` | Review sponsor join requests |
| `choir.member.manage@choir` | Shared with join slice — approve with full member authority |

## Backend

- `sponsor-capability-ids.ts`, `role-sponsor-capability-bundles.ts`, `sponsor-ui-capability-registry.ts`
- `sponsor-capability-resolver.service.ts`, `sponsor-capability.module.ts`
- Aliases: `choir.sponsor.review`, `member:manage`; `choir.operations.manage` also grants `sponsor.review@choir`
- `sponsorAuth` on `/auth/me?choirId=` and choir dashboard context
- `ChoirSponsorAccessService` + `choir-sponsor-requests.service` migrated

## Frontend

- Mirror UI registry, `sponsor-nav.ts` (augments join-requests nav for sponsor-only reviewers)
- `useSponsorAuth`; `choir.member.manage@choir` checks both join and sponsor auth
- Sponsor tab review actions on `/choir/join-requests` use `sponsor-requests-review`

## Tests

- `sponsor-capability-can.util.spec.ts`
- `sponsor-capability-contract.spec.ts`
- `sponsor-nav-page-access-parity.spec.ts`

## Deferred

| Item | Notes |
|------|-------|
| Singer join tab | Join slice (`join-requests-review`) |
| `choir-nav.ts` legacy join section | Unchanged |
| President decisions console | Separate route |

## Next domain candidates

- Music / rehearsal
- Members roster
