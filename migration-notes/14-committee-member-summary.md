# Committee member assignment capability slice

## Capability IDs (v1)

| ID | Purpose |
|---|---|
| `choir.committee_member.manage@choir` | Assign or revoke choir committee seats |

## Backend

- Extended `roles-capability-ids.ts`, `role-roles-capability-bundles.ts`, `roles-ui-capability-registry.ts`
- Alias: `committee.member.manage` → `choir.committee_member.manage@choir`
- `ChoirRolesAccessService`: `canManageCommitteeMember`, `canAssignCommitteeSeat`, require helpers
- `governance.service.ts`: choir committee assign/revoke gated via access service
- `choir-join-requests.service.ts`: roster position assign/revoke uses `requireAssignCommitteeSeat` (committee member **or** `choir.member.manage@choir`)

## Frontend

- Mirror UI registry (`roles-committee-assign` UI cap)
- `roster-manage` accepts `choir.committee_member.manage@choir`
- `useCapability.ts`: route `choir.committee_member.*` through `rolesAuth`

## Tests

- `roles-capability-can.util.spec.ts` (extended)
- `committee-member-capability-contract.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="roles-capability|committee-member-capability|roles-nav-page"`

## Deferred

| Item | Notes |
|------|-------|
| Protocol committee assign/revoke | Still legacy `committee.member.manage` at controller |
| `ProtocolCommitteePanel` | Legacy `PermissionGate` |
| `/protocol/admin` | Legacy gates |

## Next domain candidates

- Admin hub legacy gates (`ChoirAdminHub`, `/choir/admin`)
- Reports / intelligence surfaces not yet on capabilities
