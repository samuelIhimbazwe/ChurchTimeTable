# Step 0 — Contribution authorization inventory

Generated for the unified capability migration (contribution workflow slice only).

## Mechanisms in scope (to be replaced for contribution)

| # | Location | Contribution-related usage |
|---|----------|---------------------------|
| 1 | `web/lib/navigation/role-nav.ts` → `NAV_BY_ROLE` | `CHOIR_FINANCE`, `CHOIR_LEADERSHIP_NAV`, VP leadership section: `/choir/stewardship`, `/choir/budget` |
| 2 | `web/lib/navigation/role-nav.ts` → `HUB_PERMISSIONS` | `/choir/budget`: `choir.finance.manage`, `choir.finance.view` |
| 3 | `web/lib/choir/capability-registry.ts` | `finance`, `treasury-verify` tiles with legacy `anyOf` |
| 4 | `backend/src/common/choir/choir-capability-registry.ts` | Same `finance`, `treasury-verify` entries (duplicate of #3) |
| 5 | Inline checks — see tables below |

## Backend — contribution authorization

### `contribution-scope.service.ts`

| Method | Legacy logic | Target capability |
|--------|--------------|-------------------|
| `canSubmit` | `choir.contribution.submit` + memberId | `choir.contribution.submit@self` |
| `canViewOwn` | memberId present | `choir.contribution.view@self` |
| `canViewAll` | `choir.contribution.view.all` | `choir.contribution.view@choir` |
| `canViewFamily` / inbox | family leadership role OR viewAll | `choir.contribution.view@family` |
| `canApproveFamily` | HEAD / delegated ASSISTANT_HEAD | `choir.contribution.approve@family` |
| `canVerifyTreasury` | CHOIR_TREASURER role OR finance approve/manage | `choir.contribution.verify@choir` |
| `canAdjustRecord` | adjust permission OR family HEAD | `adjust@choir` / `adjust@family` |

### `finance.controller.ts`

Route guards use `@RequirePermissions` / `@RequireAnyPermissions` with:
- `CHOIR_CONTRIBUTION_SUBMIT`, `VIEW_ALL`, `ADJUST`, `TYPE_MANAGE`, `CAMPAIGN_MANAGE`
- `CHOIR_FINANCE_VIEW`, `MANAGE`, `APPROVE`
- Stewardship arrays at lines ~84–118

### Seed (`backend/prisma/seed.ts`)

Role → permission grants for `CHOIR_TREASURER`, `CHOIR_PRESIDENT`, `CHOIR_VICE_PRESIDENT`, `CHOIR_COMMITTEE`, `CHOIR_FAMILY_COORDINATOR`, `MEMBER`, committee templates with contribution permissions.

## Web — inline permission checks (contribution)

| File | Check | Notes |
|------|-------|-------|
| `choir/stewardship/page.tsx` | `choir.contribution.view.all`; catalog: type/campaign manage | Main stewardship gate |
| `choir/stewardship/admin/page.tsx` | type/campaign manage | Catalog admin |
| `choir/finance/page.tsx` | `choir.contribution.view.all`, `finance:view` | **Ambiguous**: `finance:view` legacy |
| `choir/budget/page.tsx` | catalog manage; `choir.finance.manage`, `finance:write` | Budget create gate |
| `choir/page.tsx` | `choir.contribution.view.all`, `member:manage` | Leader KPI strip — **member:manage is broad** |
| `choir/advisor/page.tsx` | `choir.finance.view`, `ministry.finance.view` for StatTile | Finance snapshot only |
| `ContributionTreasuryPanel.tsx` | view.all, finance.manage, contribution.adjust | Treasury panel sections |
| `ChoirAdminHub.tsx` | No contribution PermissionGates (privacy text only) | **No migration needed** for gates |
| `join-requests/page.tsx` | join/sponsor review only | **Out of scope** this slice |
| `membership/giving` | Uses `MemberContributionsHub` — API enforces submit | Page-level gate TBD |
| `family-leadership/contributions` | `FamilyLeadershipContributionsHub` — API enforces family scope | Page-level gate TBD |
| `budget/verify/page.tsx` | **No PermissionGate** — relies on API + nav | Add capability gate |

## Nav paths (contribution)

| Path | Source |
|------|--------|
| `/choir/stewardship` | `CHOIR_LEADERSHIP_NAV`, `CHOIR_FINANCE`, VP leadership |
| `/choir/stewardship/admin` | Linked from stewardship/budget (not in sidebar) |
| `/choir/budget` | `CHOIR_OFFICER_HUBS`, `HUB_PERMISSIONS`, `CHOIR_TREASURER` nav |
| `/choir/budget/verify` | Links from budget/stewardship (not standalone nav item) |
| `/choir/finance` | Linked from budget/stewardship tiles |
| `/choir/[id]/membership/giving` | Member portal / membership nav |
| `/choir/[id]/family-leadership/contributions` | Family office shell |

## Mobile — contribution gates

| File | Check | Web equivalent |
|------|-------|----------------|
| `governance_permissions.dart` → `financeAccessPermissions` | 9 legacy permission strings | Broader than web stewardship |
| `route_permissions.dart` → `AppRouter.finance` | `financeAccessPermissions` | vs web `view@choir` |
| `route_permissions.dart` → `AppRouter.budgets` | `choir.finance.manage` + finance list | vs web budget hub |
| `shell_destinations.dart` | Uses `canAccessFinanceNav` | May show finance for protocol treasurers |
| `leader_dashboard_screen.dart` | Finance + budgets tiles | Permission strings |
| `my_contributions_screen.dart` | No permission gate (member route) | `submit@self` / `view@self` |
| `submit_contribution_screen.dart` | API-only | `submit@self` |

**Web/mobile disagreement:** Mobile finance nav uses `financeAccessPermissions` including protocol/ministry scopes; web choir stewardship uses `choir.contribution.view.all` only on `/choir/stewardship`. Mobile shows `/finance` for `choir.finance.view`; web `/choir/finance` accepts `finance:view` OR `view.all`.

## `/auth/me` today

Returns `{ roles, permissions, member, phoneEnforcement }` — **no capabilities**, no choir scope.

JWT: `JWT_EXPIRES_IN` default **7d** — capabilities baked in JWT would be stale for office grants. **Flagged for user decision** in `01-summary.md`.

## Legacy permission strings → capability (initial alias map candidates)

| Legacy | Capability |
|--------|------------|
| `choir.contribution.submit` | `choir.contribution.submit@self` |
| `choir.contribution.view.all` | `choir.contribution.view@choir` |
| `choir.contribution.view.family` | `choir.contribution.view@family` |
| `choir.contribution.approve.family` | `choir.contribution.approve@family` |
| `choir.finance.approve` | `choir.contribution.verify@choir` |
| `choir.finance.manage` | `choir.contribution.verify@choir`, `choir.budget.manage@choir` |
| `choir.finance.view` | `choir.contribution.view@choir`, `choir.budget.view@choir` |
| `choir.contribution.adjust` | `choir.contribution.adjust@choir` |
| `choir.contribution.type.manage` | `choir.contribution.catalog.manage@choir` |
| `choir.contribution.campaign.manage` | `choir.contribution.catalog.manage@choir` |
| `finance:view` | `choir.contribution.view@choir` |
| `finance:write` | `choir.budget.manage@choir` |
| `member:manage` | **No capability** — used as broad fallback on `choir/page.tsx` KPI strip; **ambiguous, flagged** |
| `ministry.finance.view` | **Out of slice list** — advisor tile only; keep legacy for this pass |

## Permissions that do NOT map cleanly (flagged)

- `member:manage` on `choir/page.tsx` stewardship KPI — likely meant `view@choir`; migrate to capability, do not alias `member:manage` globally
- `ministry.finance.view` — cross-ministry; not in Step 1 list
- Sponsor inbox (`getSponsorInbox`) — uses view.all / finance manage; may need future `sponsor` scope (not in v1 list)
