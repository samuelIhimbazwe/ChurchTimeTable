# Budget hub role-nav capability slice

## Scope

Migrate `/choir/budget` in legacy `role-nav.ts` `HUB_PERMISSIONS` / officer hub links to capability gates (mirror care/spiritual hubs).

## Legacy permissions (unchanged in HUB_PERMISSIONS fallback)

| Legacy |
|---|
| `choir.finance.manage` |
| `choir.finance.view` |

## UI capability for hub link

`contribution-budget-hub` — same gate as `/choir/budget` page (`choir.budget.view@choir`, `choir.budget.manage@choir`, `choir.contribution.verify@choir`).

## Frontend

- `contribution-nav.ts` — `legacyBudgetHubLinkVisible`, `pageAccessForContributionRouteWithCheck`
- `role-nav.ts` — `/choir/budget` routes through `legacyBudgetHubLinkVisible`

## Tests

- `nav-page-access-parity.spec.ts` (extended with budget role-nav parity)

Run: `cd backend && npm test -- --testPathPatterns="nav-page-access-parity"`

## Deferred

- Other `HUB_PERMISSIONS` hub paths: `/choir/records`, `/choir/president`, …
- Scattered `PermissionGate`s (assets, president console, protocol, family attendance)
- `family-head/page.tsx` unused import cleanup
