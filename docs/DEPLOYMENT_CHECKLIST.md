# Pilot Deployment Checklist

## Before go-live

- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed roles and pilot choirs: `npx prisma db seed`
- [ ] Import members via Import Center (CSV)
- [ ] Review data quality dashboard
- [ ] Run permission audit report
- [ ] Run workflow simulations (`POST /api/v1/pilot/simulations/run`)
- [ ] Confirm pilot readiness score ≥ 70% on MF-6 dashboard
- [ ] Train leaders on bulk actions and notification center

## Performance review

- [ ] Verify indexes on `Notification(userId, archived)`, `ImportJob(status)`, `ImportJob(uploadedById)`
- [ ] Spot-check slow reports under church intelligence
- [ ] Test global search with typical member names

## Security review

- [ ] Confirm `CHURCH_ADMIN` lacks `SUPER_ADMIN` platform permissions
- [ ] Validate import/upload size limits at reverse proxy
- [ ] Enforce phone operational guard for write APIs
- [ ] Audit log entries for imports, exports, bulk actions, simulations

## Mobile

- [ ] Member home, membership center, broadcasts, invitations, requests screens reachable
- [ ] Offline cache configured for member dashboard payload
