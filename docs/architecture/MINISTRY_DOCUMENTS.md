# Ministry Documents (MF-3)

Versioned document library per ministry. Files are referenced by URL (upload pipeline is external); versions are never overwritten.

## Data model

- `MinistryDocument` — metadata, category (`POLICY`, `CONSTITUTION`, `GUIDELINE`, `TRAINING`, `MEETING_MINUTES`, `FORM`, `OTHER`), `currentVersionId`, `isArchived`.
- `MinistryDocumentVersion` — immutable `versionNumber`, `fileUrl`, `fileName`, optional mime/size/notes.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/ministries/:id/documents` | List active documents |
| GET | `/ministries/:id/documents/:id` | Detail + version history |
| POST | `/ministries/:id/documents` | Upload v1 |
| POST | `/ministries/:id/documents/:id/versions` | New version |
| PATCH | `/ministries/:id/documents/:id/archive` | Archive |

## Rules

- `MinistrySettings.allowDocuments` must be true.
- Manage/upload requires global ministry manage (church admin path).
- Audit: `MINISTRY_DOCUMENT_UPLOADED`; activity: `DOCUMENT_UPLOADED` / `DOCUMENT_ARCHIVED`.
- Notifications: `MINISTRY_DOCUMENT`.
