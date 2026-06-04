# Ministry Permissions

## Two layers

1. **Global role permissions** (`ministry.*`) — assigned via `Role` / `RolePermission` (e.g. `CHURCH_ADMIN`, `SUPER_ADMIN`).
2. **Per-ministry assignments** — rows on `MinistryPermissionAssignment` for a specific member and ministry.

## Scoped permission codes

Stored on assignments (and validated on grant):

- `ministry.member.view`
- `ministry.member.manage`
- `ministry.leadership.manage`
- `ministry.reports.view`
- `ministry.settings.manage`

## Runtime resolution

`PermissionsResolver` merges active assignments into the user's permission list at login:

- Plain code (e.g. `ministry.member.view`)
- Scoped claim: `ministry:{ministryId}:{permission}`

`MinistryAccessService` checks global manage first, then role permissions, then scoped map for the requested `ministryId`.

## Grant / revoke

- `POST /ministries/:id/permissions` — requires `ministry.manage`
- `DELETE /ministries/:id/permissions/:assignmentId` — soft revoke via `revokedAt`

## Audit

- `MINISTRY_PERMISSION_GRANTED`
- `MINISTRY_PERMISSION_REVOKED`
