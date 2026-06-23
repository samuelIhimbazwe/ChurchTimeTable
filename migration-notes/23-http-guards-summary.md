# Families + choir reports HTTP capability slice

## Scope

Migrate HTTP guards on `families.controller.ts` and `choir-reports.controller.ts` from legacy `@RequirePermissions` to UI capability gates with permission fallback.

## UI capabilities at HTTP layer

| Controller | UI cap | Legacy fallback |
|---|---|---|
| Families (read) | `family-hub` | `canViewFamilies` |
| Families (write) | `family-manage` | `canManageFamilies` |
| Reports summary/health | `ops-reports-hub` | `CHOIR_REPORTS_VIEW` permission set |
| Reports PDF/CSV | `ops-reports-export` | same legacy set (unchanged behavior) |

## Backend infrastructure

- `RequireUiCapability` decorator + `UiCapabilityGuard`
- `FamilyHttpAccessService`, `ChoirReportsHttpAccessService`
- `choir-ui-route-check.util.ts` (cross-domain routing for reports)
- `ChoirHttpAccessModule`

## Service parity

- `FamiliesService` assertView/assertManage → `FamilyHttpAccessService`
- `ChoirReportsService` → `ChoirReportsHttpAccessService` (view vs export)

## Tests

- `family-http-access.spec.ts`
- `choir-reports-http-access.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="family-http-access|choir-reports-http-access"`

## Deferred

- Remaining scattered `PermissionGate`s on choir pages
- Other `HUB_PERMISSIONS` hub paths in role-nav
- `family-head/page.tsx` legacy gates
- `members/page.tsx` export gate
