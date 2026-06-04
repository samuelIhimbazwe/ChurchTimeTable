# Choir Migration Plan (Documentation Only — MF-2)

**No data migration in MF-2.** This document describes how legacy choir/protocol structures will map to operational units in a future sprint.

## Mapping strategy

| Current CMMS | Future operational unit |
|--------------|-------------------------|
| `Choir` (Main Choir) | `OperationalUnit` under Music Ministry, `type=CHOIR`, code `MAIN_CHOIR` |
| Independent artists (future / informal) | `OperationalUnit`, `type=ARTIST_GROUP` |
| `ProtocolServiceTeam` | `OperationalUnit`, `type=PROTOCOL_TEAM` under Deacons' Ministry |
| Choir committee roles | `OperationalUnitLeadershipPosition` + assignments |
| `ChoirMembership` | `OperationalUnitMembership` |
| Choir custom roles / permissions | `OperationalUnitPermissionAssignment` (incremental) |

## Principles

1. **Dual-run period** — Legacy `Choir` APIs remain until feature modules (attendance, events, welfare) are rewired to `operationalUnitId`.
2. **Stable IDs** — Seed MF-2 units with known codes; migration scripts will link `Choir.id` → `OperationalUnit.id` via mapping table (future).
3. **No protocol workflows in MF-2** — Protocol teams exist as units only; `ProtocolServiceTeam` data stays untouched.
4. **Ministry gate** — `MinistrySettings.allowOperationalUnits` must be true before creating units (enforced on create).

## Out of scope until later sprints

- Moving attendance, events, families, welfare, finance, or devotions to unit scope
- Nested operational units or team hierarchy
- Deleting legacy `Choir` model

## MF-2 deliverable

Seeded units (Main Choir, Independent Artists, Protocol Team) demonstrate the target model without moving production choir data.
