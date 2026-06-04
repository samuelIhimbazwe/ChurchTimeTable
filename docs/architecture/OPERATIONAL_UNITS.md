# Operational Units (MF-2)

Operational units are **working groups inside a ministry** — choirs, artist groups, protocol teams, outreach teams, etc.

## Hierarchy

```
Church → Ministry (MF-1) → Operational Unit (MF-2) → Team (future)
```

MF-2 implements the operational unit layer only. No nested units, no protocol/choir workflows.

## Entity

`OperationalUnit` — scoped by `ministryId`, unique `(ministryId, code)` and `(ministryId, name)`.

**Types:** `CHOIR`, `ARTIST_GROUP`, `PROTOCOL_TEAM`, `SERVICE_TEAM`, `OUTREACH_TEAM`, `CUSTOM`

## API

`/api/v1/operational-units`

## Access (`OperationalUnitAccessService`)

| Role | Visibility |
|------|------------|
| Church admin / `operational_unit.manage` | All units |
| Ministry leader (active ministry leadership) | All units in that ministry |
| Unit leader (active unit leadership) | That unit (+ manage within unit rules) |
| Member | Units where enrolled, leading, or granted scoped permission |

No cross-unit leakage for scoped members.

## Seed

| Ministry | Units | Leadership titles (seeded) |
|----------|-------|----------------------------|
| Music | Main Choir (`CHOIR`) | Choir President, Choir Secretary, Advisor |
| Music | Independent Artists (`ARTIST_GROUP`) | President, Vice President, Secretary, Treasurer, Advisor |
| Deacons | Protocol Team (`PROTOCOL_TEAM`) | President, Vice President, Secretary, Treasurer, Advisor |

`allowOperationalUnits` enabled on Music and Deacons ministries.

New `CHOIR`-type units created via API receive the choir title set; other types receive the standard unit set (`operational-unit.constants.ts`).

## UI

- Web: `/dashboard/units`, `/dashboard/units/[id]`
- Mobile: `/operational-units`, `/operational-units/detail`
