# Migration summary — contribution capability slice



## What changed



### Backend (source of truth)

- **Types:** `backend/src/common/choir/capability.types.ts`

- **Capability IDs:** `contribution-capability-ids.ts` (v1 list, 13 IDs)

- **Alias map (temporary):** `capability-alias-map.ts`

- **`can()` / dedupe:** `capability-can.util.ts`

- **Role bundles:** `role-contribution-capability-bundles.ts`

- **UI registry:** `contribution-ui-capability-registry.ts`

- **Resolver:** `contribution-capability-resolver.service.ts` + `contribution-capability.module.ts`

- **`/auth/me?choirId=`** returns `contributionAuth: ResolvedAuth`

- **Choir dashboard context** includes `contributionAuth`

- **`contribution-scope.service.ts`** — submit, view, approve, verify, adjust now use capability resolver (async + `choirId`)



### Frontend

- **`capability-can.ts`**, **`capability.types.ts`**, **`contribution-ui-capability-registry.ts`** (must match backend)

- **`useCapability` / `useUiCapability`** hooks

- **`CapabilityGate`** component

- Pages migrated: `stewardship`, `stewardship/admin`, `finance`, `budget/verify`

- **Pre-merge follow-up:** contribution nav parity (`contribution-nav.ts`), `contributionAuth` refetch-on-entry, KPI strip split



### Mobile (partial)

- **`governance_permissions.dart`** — added `contributionCapabilityIds` + `hasContributionCapability()` helper for future `/auth/me?choirId=` consumption

- Finance route still uses legacy permission list as fallback until profile carries `contributionAuth`



### Tests

- `capability-can.util.spec.ts` — resolver unit cases

- `contribution-capability-contract.spec.ts` — web/backend UI registry parity

- **`nav-page-access-parity.spec.ts`** — nav visibility matches page access for 7 contribution routes × 3 personas



## Pre-merge follow-up (completed)



### Item 1 — `contributionAuth` refresh behavior

**Finding:** `contributionAuth` is loaded via React Query (`useChoirDashboardContext`) with a **2-minute `staleTime`**. It is **not** re-fetched on every route navigation within `/choir/*`; only on initial choir layout load, window refocus (React Query default), or after stale time expires. **Mid-session office grant removal could leave stale capabilities for up to 2 minutes** (or indefinitely if the user stays on one tab).



**Fix:** `useContributionAuthRefresh` in `[choirId]/layout.tsx` invalidates the dashboard context query when navigating **into** any contribution route (`membership/giving`, `family-leadership/contributions`, `budget/verify`, `stewardship`, `stewardship/admin`, `finance`, `budget`). This is refetch-on-entry only — no global polling.



### Item 2 — `choir/page.tsx` KPI strip

**Finding:** The “President-only” strip shows **join-request approvals, welfare cases, and scheduling swaps** — operational leadership metrics, **not contribution/financial data**. The bundled `choir.contribution.view.all` + `member:manage` gate was incorrect (e.g. treasurers with `view.all` saw join-request tiles they cannot action).



**Resolution:** Split into **per-tile gates** using domain-appropriate legacy permissions (`choir.join.review` / `member:manage` for approvals; welfare permissions for welfare; ops/scheduling for swaps). No `contribution-stewardship` gate — none of these tiles are contribution-related.



### Item 3 — Nav filtering for contribution routes

**Fix:** `web/lib/navigation/contribution-nav.ts` short-circuits visibility for the 7 contribution routes using `contributionAuth` from dashboard context (no second fetch). Applied in `Sidebar` via `composeContributionAwareNav`; `getComposedChoirNav` prefers capability checks when `contributionAuth` is present. Legacy `NAV_BY_ROLE` / `HUB_PERMISSIONS` structures remain intact for non-contribution routes.



**Test:** `nav-page-access-parity.spec.ts` confirms nav visibility equals `pageAccessForContributionRoute` for Treasurer, Family Head (family A), and Family Coordinator (`oversight@choir` only).



## Deliberately left untouched



| Area | Why |

|------|-----|

| Welfare, discipline, scheduling, join-requests | Out of slice scope |

| `NAV_BY_ROLE` / `HUB_PERMISSIONS` / old `choir-capability-registry` finance entries | Kept until full nav migration; contribution routes now override via `contribution-nav.ts` |

| `ChoirAdminHub`, `join-requests`, non-finance `advisor` checks | No contribution gates in those files (or out of scope) |

| `ContributionTreasuryPanel` internal PermissionGates | Migrated to CapabilityGate (post-merge cleanup) |

| Protocol / sponsor contribution flows | Not in v1 capability list |

| Seed data | Alias layer absorbs legacy strings per spec |



## Flags for user decision



### JWT / capability freshness

- Default **`JWT_EXPIRES_IN=7d`**. Capabilities are **not** embedded in JWT.

- Resolved on **`GET /auth/me?choirId=`** and **`choir dashboard context`** fetch.

- **Confirmed refresh behavior:** cached 2 minutes; refetch on contribution route entry (post follow-up), window refocus, or stale expiry — **not** on every choir navigation. Office grant changes propagate on next contribution route visit or context invalidation.



### Ambiguous migrations

- **`listAllContributions`** uses `assertCanViewChoirContributionsAny` (any choir membership with `view@choir`) because API lacks single `choirId` — may be broader than old `view.all` alone.

- **`/choir/budget` page-level gate (done):** Wrapped in `CapabilityGate uiCapability="contribution-budget-hub"`; create-budget and catalog sub-actions use `choir.budget.manage@choir` and `contribution-catalog`.

- **`ContributionTreasuryPanel` (done):** Outer gate uses `anyOf` view/verify/adjust `@choir`; adjust buttons use `choir.contribution.adjust@choir`.

### Post-merge — do not delete yet

- **`capability-alias-map.ts`** — keep until every contribution call site is migrated off legacy permission strings (inventory + contract tests in CI).
- **`NAV_BY_ROLE` / `HUB_PERMISSIONS`** — keep; contribution routes override via `contribution-nav.ts` only. Full nav structural cleanup is a future pass.



### Permissions without clean v1 mapping (not aliased)

- `ministry.finance.view` — advisor tile only; left on legacy check

- Sponsor inbox — still uses `view@choir` via choirId param



## Suggested next domain



**Welfare** (`choir.welfare.view/manage`) — touches:

- `welfare.controller.ts`, `contribution-scope` (none), `CareCaseConsole`, `/choir/welfare/*`, `HUB_PERMISSIONS` `/choir/care`, old registry `care-desk` tile



Then **discipline** — high overlap with care hub permissions.



## Legacy alias map



**Do not delete** until inventory confirms all contribution call sites migrated and contract tests pass in CI. Same retention applies to **`NAV_BY_ROLE`** and **`HUB_PERMISSIONS`** — unchanged by this slice or its follow-up.

