# Choir-scoped HTTP guards — wave 1 (roles & governance)

## Scope

First choir-domain HTTP guard wave: committee/custom role governance routes and `RolesHttpAccessService`.

## Infrastructure

- **`RolesHttpAccessService`** — scoped `rolesAuth` (+ `joinAuth` for assign) with legacy permission fallback
- **`UiCapabilityGuard`** — resolves `choirId` from query, `scopeId` param, active choir header/context; delegates `roles-*` caps to roles HTTP access

## Registry additions

- **`roles-committee-member-manage`** — `choir.committee_member.manage@choir`
- **`roles-committee-view`** — ops/rehearsal/voice view + role managers (replaces `event:read` on committee reads)

## Backend HTTP

| Controller | Routes | Capability |
|------------|--------|------------|
| `governance.controller` (choir) | Role/template/advisor mutations | `roles-committee-manage` |
| `governance.controller` (choir) | Member assign/revoke | `roles-committee-member-manage` |
| `governance.controller` (choir) | GET scope + advisor elevations | `roles-committee-view` |
| `choir-custom-roles.controller` | All routes | `roles-custom-manage` |

Service-layer `ChoirRolesAccessService` checks remain as defense in depth.

## Deferred

- `choir-service-ops` preparation routes (needs ops HTTP access service)
- Welfare, music, finance, scheduling controllers
- Mobile parity

## Tests

```bash
cd backend && npm test -- --testPathPatterns="roles-http-access|roles-capability-contract"
cd backend && npm run build
```
