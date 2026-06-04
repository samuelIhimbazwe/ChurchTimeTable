# Ministry Membership

## Model

`MinistryMembership` links a `Member` to a `Ministry`.

- **Status**: `ACTIVE`, `INACTIVE`, `REMOVED`
- **Cardinality**: A member may belong to **many** ministries simultaneously (e.g. Music + Youth).
- **Uniqueness**: `@@unique([ministryId, memberId])`

## Rules

- Adding an existing member with `REMOVED` or `INACTIVE` status reactivates them (`ACTIVE`).
- Removal is **soft** only — `status = REMOVED`; rows are not deleted.
- `DELETE /ministries/:id/members/:memberId` sets `REMOVED`.

## Access

- Global: `ministry.member.view`, `ministry.member.manage`, or `ministry.manage`
- Scoped: `ministry.member.view` / `ministry.member.manage` on `MinistryPermissionAssignment` for that ministry

## Audit

- `MINISTRY_MEMBER_ADDED`
- `MINISTRY_MEMBER_REMOVED`
