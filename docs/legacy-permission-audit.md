# Sprint L — Legacy Permission Audit (Phase 15)

**Date:** 2026-05-30  
**Scope:** `backend/`, `web/`, `mobile/`  
**Goal:** No production path depends on legacy runtime permissions (`audit:read`, `sync:admin`, `finance:read`, `finance:write`). `report:export` remains reports-only by design.

---

## Executive Summary

| Category | Count (production paths) | Status |
|----------|--------------------------|--------|
| Legacy runtime checks replaced | 5 target permissions | ✅ Complete |
| Legacy catalog entries retained | 4 (`audit:read`, `sync:admin`, `finance:read`, `finance:write`) | ✅ SUPER_ADMIN seed only |
| `report:export` production usage | Reports + finance intelligence endpoints | ✅ Intentional (reports-only) |
| Role-name dashboard fallbacks | 0 in routing | ✅ Removed |
| Web/mobile parity | Aligned (minor naming differences) | ✅ |

---

## Part 1 — Legacy Permission Replacements

### Target legacy permissions (removed from runtime)

| Legacy | Scoped replacement | Notes |
|--------|-------------------|-------|
| `audit:read` | `admin.audit.view` | `ADMIN_AUDIT_ACCESS` constant |
| `sync:admin` | `admin.sync.manage` | `ADMIN_SYNC_ACCESS` constant |
| `finance:read` | `FINANCE_VIEW_PERMISSIONS` / `FINANCE_ACCESS_PERMISSIONS` | Choir/protocol scoped claims |
| `finance:write` | `FINANCE_MANAGE_PERMISSIONS` | Manage + approve scoped claims |
| `report:export` | *(unchanged)* | Reports controller + dashboard intelligence only; excluded from leader dashboard nav |

### Production-path change inventory

| File | Line(s) | Was (legacy) | Now (scoped) |
|------|---------|--------------|--------------|
| `backend/src/audit/audit.controller.ts` | 15 | `audit:read` via `ADMIN_AUDIT_ACCESS` | `admin.audit.view` only |
| `backend/src/attendance/attendance.controller.ts` | 206, 218 | `sync:admin` | `admin.sync.manage` |
| `backend/src/finance/finance.controller.ts` | all endpoints | `finance:read` / `finance:write` | `FINANCE_VIEW_ANY` / `FINANCE_MANAGE_ANY` |
| `backend/src/finance/finance-scope.util.ts` | — | legacy finance fallback | scoped ministry scopes only |
| `backend/src/common/governance/governance-permissions.util.ts` | 171–185, 197–199 | dual-grant admin/finance | scoped claims only |
| `backend/src/common/constants/roles.ts` | 77–159 | dual-grant bundles | `LEGACY_RUNTIME_PERMISSION_SET` excluded from grants |
| `backend/prisma/seed.ts` | ROLE_PERMISSION_MAP | dual legacy+scoped grants | scoped grants only; SUPER_ADMIN gets all catalog |
| `web/core/auth/governance-permissions.ts` | 189–206, 288–294 | dual admin/finance | scoped only |
| `web/core/auth/rbac.ts` | 29–47 | `leaderRoles` / SUPER_ADMIN fallback | permission-driven only |
| `web/components/layout/search-dropdown.tsx` | — | `finance:read` | `FINANCE_ACCESS_PERMISSIONS` |
| `web/features/dashboard/components/super-admin-dashboard.tsx` | — | `sync:admin` | `canManageAdminSync()` |
| `mobile/lib/core/auth/governance_permissions.dart` | 105–127, 186–208 | legacy in nav/admin | scoped only |
| `mobile/lib/core/routing/route_permissions.dart` | 52–54 | `finance:read` | `financeAccessPermissions` |
| `mobile/lib/core/widgets/app_shell.dart` | — | `finance:read` nav | `canAccessFinanceNav` |
| `mobile/lib/features/dashboard/screens/leader_dashboard_screen.dart` | — | `finance:read` | scoped finance nav |
| `mobile/lib/features/dashboard/screens/member_dashboard_screen.dart` | 147 | `finance:read` | `canAccessFinanceNav` |

### Intentional legacy retention (catalog / non-runtime)

| File | Line | Permission | Reason |
|------|------|------------|--------|
| `backend/src/common/constants/roles.ts` | 30–40, 77–82 | All 4 legacy + `report:export` | Permission catalog; SUPER_ADMIN seed |
| `backend/prisma/seed.ts` | 111 | `Object.values(PERMISSIONS)` | SUPER_ADMIN receives full catalog including legacy entries |
| `backend/src/reports/reports.controller.ts` | multiple | `report:export` | Reports-only gate (by design) |
| `backend/src/dashboard/dashboard.controller.ts` | 67 | `report:export` | Finance intelligence widget endpoint |

### Test-only legacy references (negative assertions)

| File | Line | Permission | Purpose |
|------|------|------------|---------|
| `backend/src/common/governance/governance-permissions.util.spec.ts` | 65–67 | `audit:read`, `sync:admin` | Assert legacy does **not** grant access |
| `backend/src/auth/permissions.resolver.spec.ts` | 59–60 | `finance:read`, `finance:write` | Assert treasurer role lacks legacy grants |
| `mobile/test/auth/admin_separation_test.dart` | 11–50 | legacy strings | Negative assertions |
| `web/tests/navigation-permissions.spec.ts` | 28 | comment | Documents scoped finance nav |
| `backend/test/dashboard-hardening.e2e-spec.ts` | 148 | `report:export` | Leader dashboard hardening |

---

## Part 2 — Scoped Permission Usage (representative)

### Admin (platform)

| Permission | Backend | Web | Mobile |
|------------|---------|-----|--------|
| `admin.audit.view` | audit, dashboard, finance audit log | `canViewAdminAudit` | `canViewAdminAudit` |
| `admin.sync.manage` | attendance sync endpoints | `canManageAdminSync` | `canManageAdminSync` |
| `admin.settings.*` | system controller | platform admin nav | settings/sync routes |

### Finance (ministry-scoped)

| Permission | Usage |
|------------|-------|
| `choir.finance.view/manage/approve` | Finance controller, nav, search, family metrics |
| `protocol.finance.view/manage/approve` | Same, protocol ministry scope |
| `ministry.finance.oversight` | Cross-ministry finance intelligence |
| `finance.view` | Stewardship dashboard (web/mobile) |

### Operational (legacy-format but active — not deprecated in Sprint L)

These remain valid scoped-style claims using colon notation: `event:read`, `event:write`, `member:manage`, `family:view`, `family:manage`, `assignment:write`, etc. They were never part of the Sprint L deprecation target.

---

## Part 3 — Dashboard Experience Cleanup

### Removed

| Location | Removed pattern |
|----------|-----------------|
| `web/core/auth/rbac.ts` | `leaderRoles` array, `hasRole(profile, ['SUPER_ADMIN'])` dashboard fallback |
| `backend/src/common/constants/roles.ts` | Legacy permissions in `CHOIR_OPERATIONS_PERMS`, `PLATFORM_ADMIN_PERMISSIONS` |
| Seed dual-grants | Roles no longer receive both legacy + scoped for same capability |

### Current routing logic

```
getDashboardExperience(profile):
  if hasPlatformAdminAccess(permissions) → super-admin
  else if canAccessLeaderDashboard(permissions) || hasOperationalLeaderDashboard(permissions) → leader
  else → member
```

Mobile mirrors via `dashboardRouteForPermissions()` and `canAccessLeaderDashboard()`.

### Remaining role-name usage (non-routing)

| File | Usage | Acceptable? |
|------|-------|-------------|
| `web/features/auth/components/first-login-welcome.tsx` | Welcome copy for `SUPER_ADMIN` role | ✅ UX copy only, not access control |
| `mobile/lib/core/auth/phone_enforcement.dart` | Phone exempt roles | ✅ Policy exception, not dashboard routing |

---

## Part 4 — Seed Cleanup

| Requirement | Status |
|-------------|--------|
| Legacy permissions defined in catalog | ✅ `PERMISSIONS` object |
| No automatic dual-grants | ✅ Roles use scoped claims only |
| SUPER_ADMIN gets all permissions | ✅ `Object.values(PERMISSIONS)` |
| CHURCH_ADMIN operational only | ✅ `CHURCH_ADMIN_OPERATIONAL_PERMISSIONS` excludes platform + legacy runtime set |

**Post-deploy action:** Run `npm run prisma:seed` (or pilot seed) so existing DB role grants reflect scoped-only matrix.

---

## Part 5 — JWT / Permission Refresh

| Check | Result |
|-------|--------|
| Permissions rebuilt from DB on each request | ✅ `JwtStrategy.validate()` → `PermissionsResolver.resolveForUser()` |
| Re-login refreshes permissions | ✅ Login returns fresh JWT; subsequent requests re-resolve from DB |
| No legacy assumptions in resolver | ✅ Flat role grant merge + committee scoping |
| Tests added | ✅ `backend/src/auth/permissions.resolver.spec.ts` |

---

## Part 6 — Web / Mobile Parity

### Aligned

- `hasEffectivePermission` / committee scoping
- Leader dashboard access claims (identical list)
- Finance nav/stewardship claims
- Family view/manage gates
- Platform admin view permissions
- Admin audit/sync scoped gates

### Minor differences (documented, no behavior gap)

| Area | Web | Mobile |
|------|-----|--------|
| Finance helper naming | `canAccessFinanceStewardship`, `hasChoirFinanceView` | `canAccessFinanceNav` only (no separate stewardship fn) |
| Admin settings constants | `ADMIN_SETTINGS_MANAGE`, user/role manage exports | Not exported (settings route unguarded at route level) |
| Operational dashboard | `canAccessOperationalDashboard` exported | Uses `hasOperationalLeaderDashboard` directly |
| Extra web helpers | `isChoirOnlyOperations`, `canViewProtocolWideRoster` | Not present (web-only UI helpers) |

---

## Part 7 — Test Results

### Backend unit tests

```
npm run test — 62/62 passed (17 suites)
```

### Backend e2e tests

```
npm run test:e2e — 58/58 passed (15 suites)
```

*(E2e fixes: explicit scoped finance grants in `family-metrics.e2e-spec.ts` and `search.e2e-spec.ts` for resilient test setup.)*

### Mobile tests

Flutter SDK not available in CI shell (`flutter` not on PATH). Run locally:

```bash
cd mobile && flutter test
```

Key updated tests: `test/auth/admin_separation_test.dart`, `test/routing/route_permissions_test.dart`

---

## Legacy Permissions Still Retained

| Permission | Retained where | Runtime use |
|------------|----------------|-------------|
| `audit:read` | Permission catalog, SUPER_ADMIN seed | ❌ None |
| `sync:admin` | Permission catalog, SUPER_ADMIN seed | ❌ None |
| `finance:read` | Permission catalog, SUPER_ADMIN seed | ❌ None |
| `finance:write` | Permission catalog, SUPER_ADMIN seed | ❌ None |
| `report:export` | Seed (officer roles), reports controller | ✅ Reports + intelligence only |

---

## Risks

1. **Stale production DB grants** — Existing deployments may still have legacy grants on roles until re-seeded. Legacy grants no longer unlock endpoints, so users may lose access until scoped grants are applied.
2. **SUPER_ADMIN only path to legacy catalog** — Custom roles manually granted legacy permissions in DB will not pass new runtime checks.
3. **Pilot re-seed required** — `npm run prisma:seed` must run after deploy.

---

## Rollback Plan

1. Revert Sprint L commits on branch `feature/sprint-j-admin-separation` (or Sprint L branch).
2. Re-run seed with previous dual-grant matrix if needed.
3. Redeploy backend + web + mobile together (permission model is cross-cutting).
4. No schema rollback required — no migrations were added.

---

## Final Readiness Score

**91 / 100**

| Criterion | Score | Notes |
|-----------|-------|-------|
| No production legacy runtime deps | 25/25 | Verified by grep |
| Permission-driven dashboards | 20/20 | Role fallbacks removed |
| Web/mobile/backend alignment | 18/20 | Minor helper export gaps |
| Tests green | 23/25 | Backend 62+58 green; mobile not run (Flutter unavailable in shell) |
| No schema/migration changes | 5/5 | Confirmed |
| Seed / deploy readiness | 0/5 | Requires production re-seed |

**CMMS roadmap:** Sprint L complete pending production seed + mobile test confirmation.
