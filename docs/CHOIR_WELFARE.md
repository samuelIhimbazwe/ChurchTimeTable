# Choir Welfare Module

## Overview

Welfare cases track member care needs, fundraising, assistance delivery, and leadership review.

## Permissions

| Permission | Capability |
| --- | --- |
| `choir.welfare.view` | List/read cases, dashboard, member contributions |
| `choir.welfare.manage` | Create/update cases, record assistance, review workflow |

## API (`/api/v1/choir/welfare`)

- `GET /categories` — active categories
- `GET /dashboard` — open/urgent counts and fund totals
- `GET /cases` — paginated list (`status`, `familyId`)
- `GET /cases/:id` — case detail with contributions and assistance
- `GET /cases/:id/timeline` — audit + contribution + assistance timeline
- `POST /cases` — create case
- `POST /cases/:id/review` — approve, reject, review, request clarification
- `POST /my-contributions` — member contribution (supports anonymous)
- `GET /reports/cases.csv` / `cases.pdf` — exports

## Workflows

1. **Create** — leader opens case with category, member, requested amount.
2. **Review** — president/coordinator/welfare leader approves or requests clarification (audit + timeline).
3. **Fund** — members contribute; raised/remaining computed server-side.
4. **Assist** — leaders record cash, transport, food, hospital, volunteer, or prayer support.
5. **Notify** — case opened/approved/funded/closed (24h anti-spam per user/entity).

## Web & Mobile

- Web: `/dashboard/welfare`, `/dashboard/welfare/[id]`, `/dashboard/welfare/new`
- Mobile: `/welfare` list + case detail with contribute action
