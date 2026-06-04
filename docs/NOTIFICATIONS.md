# Notifications (PILOT-READY-1)

## Notification center

`GET /api/v1/notifications` supports:

- `unreadOnly=true`
- `archived=true` (archive inbox)
- `q` — search title/body
- `type` — filter by `NotificationType`

Actions:

- `PATCH /api/v1/notifications/:id/read`
- `POST /api/v1/notifications/mark-all-read`
- `PATCH /api/v1/notifications/:id/archive`
- `PATCH /api/v1/notifications/:id/unarchive`

## Notification rules

Configurable triggers (seeded on startup):

- Service / rehearsal today and tomorrow
- Protocol and choir assignments
- Schedule change, replacement approved
- Invitation received, request approved/rejected

Channels: `IN_APP` (default), `PUSH` and `EMAIL` reserved for future use.

Manage via `GET/PATCH /api/v1/pilot/notification-rules`.
