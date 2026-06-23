# Spiritual hub role-nav capability slice

## Scope

Migrate `/choir/spiritual` in legacy `role-nav.ts` `HUB_PERMISSIONS` / officer hub links to capability gates (mirror `care-hub-nav.ts`).

## Legacy permissions (unchanged in HUB_PERMISSIONS fallback)

| Legacy |
|---|
| `choir.devotion.manage` |
| `choir.intercession.manage` |
| `choir.spiritual.program.manage` |

## UI capability for hub link

`devotion-spiritual-content` — same gate as `/choir/spiritual` page content.

## Frontend

- `devotion-nav.ts` — `legacySpiritualHubLinkVisible`, `composeDevotionAwareNav` via `capabilityCheck`
- `role-nav.ts` — `/choir/spiritual` routes through `legacySpiritualHubLinkVisible`
- `Sidebar.tsx` — passes `capabilityCheck` to `composeDevotionAwareNav` (not `devotionAuth`)

## Tests

- `devotion-nav-page-access-parity.spec.ts` (extended with role-nav parity)

Run: `cd backend && npm test -- --testPathPatterns="devotion-nav-page|spiritual-devotion|care-hub-nav"`

## Deferred

- Other `HUB_PERMISSIONS` hub paths: `/choir/budget`, `/choir/records`, `/choir/president`, …
- Scattered `PermissionGate`s (assets, president console, protocol, family attendance)
- `family-head/page.tsx` unused import cleanup
