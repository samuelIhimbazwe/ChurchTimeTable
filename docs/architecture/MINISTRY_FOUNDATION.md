# Ministry Foundation (MF-1)

Sprint MF-1 introduces the **church ministry layer** that future modules (operational units, assets, attendance, welfare, etc.) will attach to.

## Hierarchy (target architecture)

```
Church
  └── Ministries (MF-1)
        └── Operational Units (MF-2+)
              └── Subdivisions (later)
```

MF-1 implements **Ministries only** — not operational units, choir migration, protocol teams, or family subdivisions.

## Core entities

| Entity | Purpose |
|--------|---------|
| `Ministry` | Catalog row (code, name, description, `isActive`) |
| `MinistryMembership` | Member enrollment (`ACTIVE` / `INACTIVE` / `REMOVED`) |
| `MinistryLeadershipPosition` | Titles (President, Secretary, custom) — **no permissions** |
| `MinistryLeadershipAssignment` | Historical leadership records (never deleted) |
| `MinistryPermissionAssignment` | Per-ministry permission grants (separate from titles) |
| `MinistrySettings` | Feature flags per ministry (one row per ministry) |

## API

Base path: `/api/v1/ministries`

See backend module: `backend/src/ministries/`

## Permissions (global)

| Code | Purpose |
|------|---------|
| `ministry.view` | List/view ministries |
| `ministry.create` | Create ministries |
| `ministry.manage` | Full administration |
| `ministry.member.view` / `ministry.member.manage` | Membership |
| `ministry.leadership.view` / `ministry.leadership.manage` | Leadership |
| `ministry.settings.view` / `ministry.settings.manage` | Settings |
| `ministry.reports.view` | Summary / reports |

Per-ministry grants use the same string codes on `MinistryPermissionAssignment` and are merged into JWT permissions at login (plus scoped `ministry:{id}:{code}` claims).

## Seed

Nine ministries (including `CHURCH` for church-wide leadership) and system leadership positions per ministry are seeded in `backend/prisma/seed.ts`. See `MINISTRY_LEADERSHIP.md` for title sets.

## UI

- Web: `/dashboard/ministries`, `/dashboard/ministries/[id]`
- Mobile: `/ministries`, `/ministries/detail`

## Out of scope (MF-1)

Operational units, choir/protocol migration, families, assets, attendance, welfare, finances, multi-church.
