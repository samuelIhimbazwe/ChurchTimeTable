# Go-Live Checklist

## Deployment readiness indicators

| Key | Description |
|-----|-------------|
| leadershipConfigured | Leadership roles or setup data present |
| membersImported | ≥ 5 active members |
| choirsConfigured | ≥ 1 active choir |
| protocolConfigured | ≥ 3 protocol members |
| schedulesCreated | ≥ 1 published operation occurrence |
| notificationsActive | ≥ 3 enabled notification rules |
| importsCompleted | ≥ 1 completed import job |
| importUiReady | Import Center UI deployed |
| reminderJobsActive | Successful reminder run in last 48h |
| notificationLogsActive | Delivery log subsystem active |
| e2ePassing | `goLiveE2eVerified` or `CMMS_E2E_VERIFIED=true` |

## Levels

- **NOT_READY** — Score &lt; 30%
- **PARTIAL** — 30–54%
- **READY** — 55–74%
- **PILOT_READY** — ≥ 75% and setup completed
- **LIVE_READY** — ≥ 90% and setup completed

## Go-live report

`GET /api/v1/deployment/go-live-report` — score, failed checks, warnings, recommendations.

## Before pilot

1. Complete setup wizard (7 steps).
2. Import real data via Import Center.
3. Confirm reminder dashboard shows recent SUCCESS runs.
4. Run full e2e suite on seeded database.
5. Set `ChurchConfiguration.goLiveE2eVerified` or `CMMS_E2E_VERIFIED=true` after e2e passes.
