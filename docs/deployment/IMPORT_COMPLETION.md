# Import Completion (DEPLOYMENT-READY-1)

## Supported types

`MEMBERS`, `CHOIR_MEMBERS`, `PROTOCOL_MEMBERS`, `MINISTRIES`, `MINISTRY_MEMBERS`, `LEADERSHIP_ASSIGNMENTS`, `ASSETS`, `SCHEDULES`

## Preview buckets

- Valid  
- Invalid  
- Duplicates  
- Conflicts  
- Warnings (e.g. missing phone)  

## Conflict resolution (confirm body)

```json
{ "conflictStrategy": "SKIP" | "REPLACE" | "MERGE" | "MANUAL_REVIEW" }
```

## APIs

| Method | Path |
|--------|------|
| POST | `/api/v1/imports` |
| GET | `/api/v1/imports/:id` |
| POST | `/api/v1/imports/:id/confirm` |
| POST | `/api/v1/imports/:id/cancel` |
| GET | `/api/v1/imports/:id/results` |

`MEMBERS` confirm is fully implemented; other types validate in preview and record skipped rows until handlers land.
