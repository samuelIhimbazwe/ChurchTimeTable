# Choir-scoped HTTP guards — wave 5 (finance controller)

## Scope

`ContributionHttpAccessService` and full migration of guarded `finance.controller` routes.

## Registry additions

**Choir (`contribution-*`):**
- `contribution-list-view`, `contribution-record-write`, `contribution-stewardship-analytics`
- `contribution-sponsor-inbox`, `contribution-treasury-operations`
- `contribution-finance-view`, `contribution-finance-manage`, `contribution-finance-approve`

**Platform:**
- `protocol-contribution-submit`, `protocol-finance-inbox`

## Backend HTTP

All previously `@RequirePermissions` / `@RequireAnyPermissions` routes on `finance.controller` now use `@RequireUiCapability`. Member/family workflow routes remain service-layer gated (unchanged).

## Deferred

- `ministry-finance.controller`
- Rehearsals, operations, devotions
- Mobile parity

## Tests

```bash
cd backend && npm test -- --testPathPatterns="contribution-http-access|contribution-capability-contract|platform-ui-capability-contract|platform-http-access"
cd backend && npm run build
```
