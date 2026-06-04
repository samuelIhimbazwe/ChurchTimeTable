# Choir Rehearsals

## Overview

Rehearsal plans attach to `Event` records with `type = REHEARSAL`. Plans include songs, section readiness, and attendance.

## Permissions

| Permission | Capability |
| --- | --- |
| `choir.rehearsal.view` | Dashboard, plan read, attendance read, analytics |
| `choir.rehearsal.manage` | Upsert plan, record attendance |
| `choir.music.view` | Read-only plan access (shared with music leaders) |

## API (`/api/v1/choir/rehearsals`)

- `GET /dashboard` — upcoming rehearsals with readiness summary
- `GET /analytics` — section and attendance intelligence
- `GET /plans/:eventId` — plan with songs and voice sections
- `PUT /plans/:eventId` — upsert plan (songs order, difficulty, section readiness)
- `GET /plans/:eventId/attendance` — roster attendance
- `POST /plans/:eventId/attendance` — bulk attendance marks
- `GET /plans/:eventId/attendance.pdf` — PDF export

## Notifications

Plan updates notify choir leaders (24h anti-spam).

## Web & Mobile

- Web: `/dashboard/rehearsals` (event-integrated editor on rehearsal events)
- Mobile: `/rehearsals` dashboard
