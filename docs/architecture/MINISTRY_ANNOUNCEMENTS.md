# Ministry Announcements (MF-3)

Shared announcement service for all ministries. Choir and other domains keep their own announcement flows until migrated.

## Data model

- `MinistryAnnouncement` — title, content, priority (`LOW` | `NORMAL` | `HIGH` | `URGENT`), audience (`ALL_MINISTRY`, `LEADERSHIP_ONLY`, `UNIT_LEADERS`, `CUSTOM`), publish/expiry, pin/active flags.
- `MinistryAnnouncementRead` — per-member read receipts.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/ministries/:id/announcements` | List for ministry |
| GET | `/announcements/:id` | Detail |
| POST | `/announcements` | Create (leaders) |
| PATCH | `/announcements/:id` | Update |
| DELETE | `/announcements/:id` | Soft deactivate |
| POST | `/announcements/:id/publish` | Publish |
| POST | `/announcements/:id/pin` | Pin (one per ministry) |
| POST | `/announcements/:id/read` | Mark read (members) |

## Rules

- Gated by `MinistrySettings.allowAnnouncements`.
- Scoped via `MinistryAccessService` — no cross-ministry leakage.
- Only one pinned announcement per ministry.
- Audit: `MINISTRY_ANNOUNCEMENT_CREATED`; activity: `ANNOUNCEMENT_CREATED` / `ANNOUNCEMENT_PUBLISHED`.
- Notifications: `MINISTRY_ANNOUNCEMENT` with `ministryId` on the notification row.

## Web / mobile

- Web: `/dashboard/ministries/[id]/announcements`
- Mobile: Ministry services tab + offline list cache
