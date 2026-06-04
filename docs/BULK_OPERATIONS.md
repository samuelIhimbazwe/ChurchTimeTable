# Bulk Operations

## Members (`POST /api/v1/pilot/bulk/members`)

| Action | Payload |
|--------|---------|
| `ASSIGN_MINISTRY` | `memberIds`, `ministryId` |
| `ASSIGN_CHOIR` | `memberIds`, `choirId`, optional `role` |
| `REMOVE_CHOIR` | `memberIds`, `choirId` |
| `ACTIVATE` | `memberIds` |
| `DEACTIVATE` | `memberIds` (sets `TEMPORARILY_INACTIVE`) |

## Notifications (`POST /api/v1/pilot/bulk/notify`)

`memberIds`, `title`, `body` — creates in-app notifications per member user.

## Choir / protocol / ministry bulk

Use existing domain APIs (scheduling, protocol teams, ministry leadership) for specialized bulk flows; pilot bulk focuses on cross-cutting member and notification actions.
