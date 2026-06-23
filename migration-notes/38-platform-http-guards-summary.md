# Platform HTTP capability guards

## Scope

Backend HTTP guards for protocol/church/system routes using scoped platform capabilities on `/auth/me`, with legacy permission fallback.

## Infrastructure

| Piece | Role |
|-------|------|
| `platform-ui-capability-registry.ts` | Backend copy of web registry (contract-tested) |
| `platform-capability-router.util.ts` | Routes `@ministry` / `@church` / `@platform` caps |
| `PlatformHttpAccessService` | Resolves platform auths + legacy permission fallback |
| `UiCapabilityGuard` | Delegates unknown UI cap ids to `PlatformHttpAccessService` |

## Migrated controllers

| Controller | UI capability | Routes |
|------------|---------------|--------|
| `protocol-portal.controller` | `protocol-invite` | POST/GET invitations |
| `protocol-portal.controller` | `protocol-claims-review` | PATCH claims/:id |
| `church-facilities.controller` | `church-facility-manage` | POST, PATCH |
| `church-schedule-submissions.controller` | `church-schedule-submit` | POST, PATCH, submit, accept-counter |
| `church-schedule-submissions.controller` | `church-schedule-view-queue` | GET conflicts |
| `members.controller` | `member-manage` | GET list, GET :id, PATCH :id/status |
| `system-users.controller` | `admin-users-manage` | POST, PATCH, roles, reset-password |

Read routes and mixed-permission endpoints still use `@RequireAnyPermissions` / `@RequirePermissions`.

## Tests

```bash
cd backend && npm test -- --testPathPatterns="platform-http-access|platform-ui-capability-contract|platform-capability|platform-ui-capability"
```

## Deferred

- `protocol.controller` (large surface)
- `church-schedule-timetable.controller`, remaining submission GET routes
- `church-intelligence.controller`, `system.controller` stats
- `reports.controller` `report-export` cap
- Service-layer assert parity (controllers only this slice)
