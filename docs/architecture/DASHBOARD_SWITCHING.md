# Dashboard Switching

`GET /member-portal/dashboard-context` returns available dashboards based on roles and memberships:

- **member** — always (`/dashboard/member`)
- **choir** — active `ChoirMembership`
- **protocol** — active protocol unit membership
- **choir-leader** — choir operations permissions
- **protocol-leader** — protocol manage/oversight
- **operations** — MF-7 operations view
- **admin** — platform admin claims

Clients use `defaultDashboard` and the `dashboards[]` list to show switchers. Existing `/dashboard` overview remains; portal dashboard is at `/dashboard/member`.
