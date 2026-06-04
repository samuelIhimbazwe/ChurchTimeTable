# Unit Permissions

## Global (`operational_unit.*`)

Role-granted: `operational_unit.view`, `operational_unit.manage`, member/leadership/settings/reports variants.

## Per-unit assignments

`OperationalUnitPermissionAssignment` stores scoped codes:

- `operational_unit.member.view`
- `operational_unit.member.manage`
- `operational_unit.leadership.manage`
- `operational_unit.reports.view`
- `operational_unit.settings.manage`

Merged at login as plain codes and `operational_unit:{unitId}:{permission}` scoped claims.

## Audit

- `OPERATIONAL_UNIT_PERMISSION_GRANTED`
- `OPERATIONAL_UNIT_PERMISSION_REVOKED`
