# Member Experience

After approval, members land on `/dashboard/member` (not choir/protocol dashboards).

## Widgets

- **Spiritual** — verse of the day
- **Church life** — upcoming services, events, announcements
- **Media** — live broadcast and recent sermons
- **Participation** — choir, protocol, ministries with discovery links
- **Activity** — requests, invitations, notifications

## First login

`FirstLoginWelcome` modal on first approved login with skip option. Completes via `PATCH /auth/onboarding-complete`.

## Pending members

`NEW_MEMBER` and `PENDING` statuses route to `/pending-approval` until a leader activates the account.
