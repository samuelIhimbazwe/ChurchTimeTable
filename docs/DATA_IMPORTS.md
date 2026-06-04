# Data Imports

## Supported types

`MEMBERS`, `CHOIR_MEMBERS`, `PROTOCOL_MEMBERS`, `MINISTRIES`, `MINISTRY_MEMBERS`, `LEADERSHIP_ASSIGNMENTS`, `ASSETS`, `SCHEDULES`

## Formats

- **CSV** — fully supported
- **Excel (.xlsx)** — export sheets to CSV before upload

## Flow

1. `POST /api/v1/imports` with multipart field `file` and `type`
2. Review preview: valid, invalid, duplicate, and conflict rows
3. `POST /api/v1/imports/:id/confirm` — nothing imports until confirmed

## Member CSV columns

`firstName`, `lastName`, `email`, `phone` (headers are case-insensitive)

Imported users receive temporary password `ChangeMe1!` — leaders must reset on first login.
