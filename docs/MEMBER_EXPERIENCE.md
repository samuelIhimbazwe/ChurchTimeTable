# Member Experience

After approval, members land on `/dashboard/member` (not choir/protocol dashboards).

## Widgets

- **Spiritual** — verse of the day
- **Church life** — upcoming services, events, announcements
- **Media** — live broadcast and recent sermons
- **Participation** — choir, protocol, ministries with discovery links
- **Activity** — requests, invitations, notifications

## First login

After the first approved login, a **welcome modal** invites users to start a short **interactive guided tour**. The tour highlights key UI areas (portal home, quick actions, navigation, search, notifications, help) with role-specific copy for members, choir leaders, treasurers, and protocol coordinators.

- **Start tour** — step-by-step spotlight walkthrough on the live interface
- **Remind me later** — defers until next session; a resume card appears on the portal
- **Skip for now** — marks onboarding complete via `PATCH /auth/onboarding-complete`
- **Replay** — Help menu (? or Help icon) → **Replay product tour**

Tour definitions live in `web/lib/tour/` (steps, personas, copy). Targets use `data-tour` attributes on shell and portal components.

## Registration vs ministry approval

New accounts are `ACTIVE` after registration and land on the member portal. Approval is required only when joining a **choir** (join request reviewed by choir admin) or **protocol** (invitation accept or claim review). Legacy `NEW_MEMBER` records may still exist from imports or admin workflows.
