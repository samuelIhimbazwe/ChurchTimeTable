# Member Portal (MEMBER-PORTAL-1)

Every registered user is a **church member** via `Member` + `User` (registration at `/auth/register`). No choir or protocol membership is required for the base portal.

## API

| Path | Purpose |
|------|---------|
| `GET /member-portal/dashboard` | Church member dashboard widgets |
| `GET /member-portal/membership` | Membership center |
| `GET /member-portal/dashboard-context` | Role-based dashboard switching |
| `GET /church/broadcasts` | Broadcast list |
| `GET /church/broadcasts/live` | Live streams |
| `GET /choirs/public` | Choir discovery |
| `POST /choirs/join-requests` | Submit join request |
| `GET/PATCH /choirs/join-requests` | List / review / withdraw |
| `POST/GET/PATCH /protocol/invitations` | Protocol invitations |
| `POST/GET/PATCH /protocol/claims` | Existing member claims |

## Web routes

- `/dashboard/member` — member dashboard
- `/join-choir`, `/join-protocol`, `/membership`, `/broadcasts`, `/live`, `/my-requests`, `/my-invitations`

## Principle

The system supports leaders; it does not replace them. All choir and protocol membership changes go through approval or invitation workflows.
