# Data Quality

`GET /api/v1/system/data-quality` returns `DataQualityMetrics`:

| Metric | Description |
|--------|-------------|
| `missingPhoneNumbers` | Active directory members without phone |
| `duplicateMembers` | Shared phone numbers |
| `missingLeadership` | Active ministries without leadership assignments |
| `inactiveMinistries` | Ministries marked inactive |
| `inactiveUnits` | Operational units marked inactive |
| `invalidAssignments` | Event assignments linked to non-active members |
| `orphanRecords.activeMembersWithoutChoir` | Active members with no active choir membership |

Requires `pilot.readiness.view`, `church.intelligence.view`, or admin settings access.
