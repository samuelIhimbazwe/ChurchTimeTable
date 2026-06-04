# Unit Leadership

Leadership titles (`OperationalUnitLeadershipPosition`) do **not** grant permissions.

Assignments (`OperationalUnitLeadershipAssignment`) preserve history via `endedAt` — never deleted.

Unit leaders gain **unit-scoped management** for members/leadership/settings per `OperationalUnitAccessService`, not global church access.

## Audit

- `OPERATIONAL_UNIT_LEADERSHIP_ASSIGNED`
- `OPERATIONAL_UNIT_LEADERSHIP_ENDED`
