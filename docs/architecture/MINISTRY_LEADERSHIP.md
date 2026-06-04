# Ministry Leadership

## Separation from permissions

**Leadership titles do not grant permissions.** Titles are stored on `MinistryLeadershipPosition` and assigned via `MinistryLeadershipAssignment`.

Permissions are granted separately through `MinistryPermissionAssignment`.

## Positions

Positions are free-form titles on `MinistryLeadershipPosition` (unique per ministry). Multiple members may hold the same title (e.g. several Advisors).

**Seeded sets** (`backend/src/ministries/ministry.constants.ts`):

| Ministry | Titles |
|----------|--------|
| `CHURCH` (Church Leadership) | Pastor, Deputy Pastor, Secretary, Treasurer, Advisor |
| All other ministries | President, Vice President, Secretary, Treasurer, Advisor |

New ministries created via API receive the standard ministry set (or the church set when `code` is `CHURCH`).

## Assignments

- `startedAt` / `endedAt` — active when `endedAt` is null
- **History is preserved** — assignments are never deleted; ending sets `endedAt`
- `PATCH /ministries/:id/leadership/:assignmentId` ends an assignment

## Audit

- `MINISTRY_LEADERSHIP_ASSIGNED`
- `MINISTRY_LEADERSHIP_ENDED`
