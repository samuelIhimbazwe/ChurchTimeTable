# Ministry Devotions (MF-3)

Extends the existing Devotion Center with ministry and operational-unit scope.

## Schema

`Devotion` fields:

- `choirId` — nullable (legacy choir devotions)
- `ministryId` — optional
- `operationalUnitId` — optional
- `visibilityScope` — `CHOIR` | `CHURCH` | `MINISTRY` | `OPERATIONAL_UNIT`

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/ministries/:id/devotions` | Published feed for ministry |
| POST | `/ministries/:id/devotions` | Create draft |
| POST | `/ministries/:id/devotions/:id/publish` | Publish + notify |

## Visibility examples

- Music Ministry President → `visibilityScope: MINISTRY`, `ministryId` set
- Protocol coordinator (future unit) → `OPERATIONAL_UNIT` + `operationalUnitId`
- Senior Pastor → `CHURCH` (church-wide; seed/admin path)

## Rules

- `MinistrySettings.allowDevotions`.
- Audit: `MINISTRY_DEVOTION_PUBLISHED`.
- Notifications: `MINISTRY_DEVOTION` with `ministryId`.
- Activity: `DEVOTION_PUBLISHED`.

Choir devotion APIs unchanged; no choir migration in MF-3.
