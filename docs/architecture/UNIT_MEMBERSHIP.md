# Unit Membership

`OperationalUnitMembership` links members to operational units.

- Status: `ACTIVE`, `INACTIVE`, `REMOVED`
- A member may belong to **multiple units** (even across ministries)
- Removal is soft (`REMOVED`); rows are retained

## Audit

- `OPERATIONAL_UNIT_MEMBER_ADDED`
- `OPERATIONAL_UNIT_MEMBER_REMOVED`
