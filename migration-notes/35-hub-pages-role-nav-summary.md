# Hub pages, scattered gates, NAV_BY_ROLE, and sidebar compose

## Scope

Complete remaining choir capability migration slices after officer hub role-nav.

## Page gates

| Page | UI capability |
|------|----------------|
| `/choir/advisor` | `advisor-hub` — snapshot tiles use `CapabilityGate` / `useAnyCapability` |
| `/choir/records` | `records-hub` |
| `/choir/family-head` | `family-head-hub` |

`useUiCapability` extended for `advisor-hub` and `records-hub` registries.

## Scattered PermissionGate → CapabilityGate

| Component | UI capability |
|-----------|----------------|
| `PresidentDecisionConsole` | `join-requests-review` |
| `ChoirAssetsManagePanel` (register asset) | `logistics-equipment-manage` |
| `FamilyOperationsPage` (mark team) | `hub-attendance-link` |

## NAV_BY_ROLE → capability-aware

- `web/lib/navigation/role-nav-capability.ts` — `pageAccessForRoleNavPath`, `filterRoleNavSections`
- `getChoirNavForUser` filters `NAV_BY_ROLE` sections when `capabilityCheck` is provided
- Legacy role-based nav unchanged when no capability router

## Sidebar compose

- `composeFamilyAwareNav` and `composeAdvisorHubAwareNav` wired in `Sidebar.tsx` (after records hub layer)

## Tests

- `role-nav-capability.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="role-nav-capability"`

## Deferred

- Protocol / church / system `PermissionGate`s (out of choir slice)
- Page gates for `/choir/president`, `/choir/vice-president` hubs
- Eventually remove legacy `HUB_PERMISSIONS` / `NAV_BY_ROLE` fallbacks
