# Ministry Meetings (MF-3)

Meetings, attendance, decisions, and action items for any ministry.

## Data model

- `MinistryMeeting` — schedule, location, status (`PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- `MinistryMeetingAttendee` — member presence.
- `MinistryMeetingDecision` — decision text.
- `MinistryMeetingActionItem` — assignee, due date, status (`OPEN`, `IN_PROGRESS`, `DONE`, `CANCELLED`).

## API

Base: `/ministries/:ministryId/meetings`

- CRUD on meetings
- `POST .../attendees` — record attendance
- `POST .../decisions` — add decision
- `POST .../action-items` — create action item
- `PATCH .../action-items/:itemId/complete` — complete item

## Rules

- `MinistrySettings.allowMeetings`.
- Audit: `MINISTRY_MEETING_CREATED`, `MINISTRY_MEETING_COMPLETED`, `MINISTRY_ACTION_ITEM_*`.
- Activity feed mirrors meeting and action-item events.
- Notifications: `MINISTRY_MEETING`, `MINISTRY_ACTION_ITEM`.
