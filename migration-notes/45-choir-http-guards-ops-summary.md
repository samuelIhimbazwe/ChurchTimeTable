# Choir-scoped HTTP guards — wave 2 (ops & service preparation)

## Scope

`OpsHttpAccessService` and migration of service preparation routes off legacy permissions.

## Infrastructure

- **`OpsHttpAccessService`** — scoped `opsAuth` + `musicAuth` (for rehearsal view) with legacy fallback
- **`UiCapabilityGuard`** — delegates `ops-*` capabilities (reports still use `ChoirReportsHttpAccessService` via explicit switch cases)

## Registry

- **`ops-scheduling-hub`** — now includes `choir.rehearsal.view@choir` (music directors can view service prep)

## Backend HTTP

| Controller | Routes | Capability |
|------------|--------|------------|
| `choir-service-ops` | GET service-preparation | `ops-scheduling-hub` |
| `choir-service-ops` | POST service-preparation | `ops-service-prep-manage` |

Member preparation routes remain service-layer gated (any authenticated member with choir context).

## Deferred

- `choir-scheduling.controller` (large ops surface)
- Welfare, music, finance controllers
- Mobile parity

## Tests

```bash
cd backend && npm test -- --testPathPatterns="ops-http-access|ops-capability-contract"
cd backend && npm run build
```
