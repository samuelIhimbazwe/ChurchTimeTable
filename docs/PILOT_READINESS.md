# Pilot Readiness (PILOT-READY-1)

CMMS pilot deployment prepares existing modules for real church usage: imports, bulk actions, notifications, permissions audit, workflow simulation, data quality, exports, and readiness scoring.

## APIs

| Area | Endpoints |
|------|-----------|
| Imports | `POST /api/v1/imports`, `GET /api/v1/imports`, `GET /api/v1/imports/:id`, `POST /api/v1/imports/:id/confirm` |
| Bulk | `POST /api/v1/pilot/bulk/members`, `POST /api/v1/pilot/bulk/notify` |
| Exports | `GET /api/v1/pilot/exports`, `GET /api/v1/pilot/exports/:type` |
| Data quality | `GET /api/v1/system/data-quality` |
| Readiness | `GET /api/v1/system/pilot-readiness`, `GET /api/v1/pilot/readiness` |
| MF-6 dashboard | `GET /api/v1/church/intelligence/dashboard` includes `pilotReadiness` |
| Permission audit | `GET /api/v1/pilot/permission-audit` |
| Simulations | `POST /api/v1/pilot/simulations/run` |
| Notification rules | `GET /api/v1/pilot/notification-rules`, `PATCH /api/v1/pilot/notification-rules/:trigger` |

## Permissions

Granted to `CHURCH_ADMIN` via `PILOT_ADMIN_PERMISSIONS`:

- `pilot.import.manage`
- `pilot.bulk.manage`
- `pilot.export`
- `pilot.readiness.view`
- `pilot.simulation.run`

## Web admin tools

`/dashboard/admin/tools` — links to imports, exports, data quality, permission audit, simulations, and system readiness.

## Success criteria

See sprint checklist in repository planning docs.

### E2E verification

From `backend/`:

```bash
npx jest --config ./test/jest-e2e.json imports.e2e-spec.ts bulk-actions.e2e-spec.ts notification-rules.e2e-spec.ts permission-audit.e2e-spec.ts data-quality.e2e-spec.ts pilot-readiness.e2e-spec.ts workflow-simulation.e2e-spec.ts --runInBand --forceExit
```

All seven pilot suites pass against the e2e SQLite database (`prisma db push` in global setup).
