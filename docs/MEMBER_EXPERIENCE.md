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

## Registration vs ministry approval

New accounts are `ACTIVE` after registration and land on the member portal. Approval is required only when joining a **choir** (join request reviewed by choir admin) or **protocol** (invitation accept or claim review). Legacy `NEW_MEMBER` records may still exist from imports or admin workflows.
