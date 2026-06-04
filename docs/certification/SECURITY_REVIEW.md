# Security Review — Choir Module

**Date:** 2026-05-31

## RBAC model

Permissions defined in `backend/src/common/constants/roles.ts` and seeded in `prisma/seed.ts`.

| Permission | Typical grant |
|------------|---------------|
| `choir.welfare.view` | Member+ |
| `choir.welfare.manage` | President, Coordinator |
| `choir.music.view` | Member+ |
| `choir.music.manage` | President, Rehearsal director |
| `choir.rehearsal.view` | Member+ |
| `choir.rehearsal.manage` | President, Rehearsal director |
| `choir.operations.manage` | Choir officers |
| `choir.reports.view` | President, Treasurer (view) |
| `choir.document/meeting/uniform/equipment.manage` | President, Secretary |

## Route guards

| Layer | Implementation |
|-------|----------------|
| API | `@RequirePermissions` / `@RequireAnyPermissions` on choir controllers |
| Web | `ProtectedRoute`, `governance-permissions.ts`, nav filtering |
| Mobile | `route_permissions.dart`, drawer gating |
| Search | Per-entity RBAC in `search.service.ts` |

## Member restrictions (verified by seed + e2e)

- Members **cannot** access executive choir reports export without `choir.reports.view` / manage perms
- Members **cannot** record welfare assistance (`choir.welfare.manage` required)
- Members **cannot** adjust contributions (Sprint 10 frozen — treasurer/president only)
- Stewardship dashboards hidden via `ResponseVisibilityService`

## Secretary scope

- `CHOIR_SECRETARY` role: events, assignments, attendance write, export — **no** welfare manage by default
- Cannot approve welfare cases unless explicitly granted `choir.welfare.manage`

## Family scope

- Family metrics and contributions respect finance visibility rules
- Welfare cases tied to member; familyId optional on case

## Audit

- Welfare case create/review/assistance logged via `AuditService`
- Contribution timeline frozen Sprint 10 contract

## File access

- Song assets served via `fileUrl` — ensure production uses signed URLs or auth proxy (deployment note)

## Verdict

**RBAC:** ✅ Consistent across API/web/mobile for choir MVP  
**Production hardening:** Configure HTTPS, rotate JWT secrets, restrict CORS (`WEB_ORIGIN`)
