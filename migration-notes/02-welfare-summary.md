# Migration summary — welfare capability slice

## What changed

### Backend
- **Capability IDs:** `welfare-capability-ids.ts` (`view@choir`, `manage@choir`)
- **Alias map:** `choir.welfare.view` / `choir.welfare.manage` added to `capability-alias-map.ts`
- **Role bundles:** `role-welfare-capability-bundles.ts`
- **UI registry:** `welfare-ui-capability-registry.ts`
- **Resolver:** `welfare-capability-resolver.service.ts` + `welfare-capability.module.ts`
- **`/auth/me?choirId=`** and **choir dashboard context** include `welfareAuth`
- **`welfare.service.ts`** — `assertWelfareAccess` uses capability resolver + `getActiveChoirId()`

### Frontend
- **`welfare-ui-capability-registry.ts`** (mirrors backend)
- **`welfare-nav.ts`** — nav overrides for `/choir/welfare`, `/choir/care/desk` (and scoped equivalents)
- **`useCapability` hooks** — welfare UI caps + `choir.welfare.*` capability IDs route to `welfareAuth`
- **Pages:** `welfare`, `welfare/cases/[id]`, `care/desk`
- **Components:** `CareCaseConsole`, `WelfareCreateWizard`
- **Auth refresh** — welfare routes included in dashboard context invalidation

### Tests
- `welfare-capability-can.util.spec.ts`
- `welfare-capability-contract.spec.ts` — web/backend UI registry parity
- `welfare-nav-page-access-parity.spec.ts`

## Deliberately left untouched

| Area | Why |
|------|-----|
| `/choir/care` hub page (discipline sections) | Discipline domain — next slice |
| `NAV_BY_ROLE` / `HUB_PERMISSIONS` `/choir/care` | Mixed care+discipline; welfare nav override only for welfare routes |
| `choir/page.tsx` welfare KPI tile | Still uses legacy welfare+discipline bundle gate |
| Portal `/portal/welfare` | Out of v1 welfare capability list |
| Alias map deletion / full nav restructure | Same retention policy as contribution slice |

## Suggested next domain

**Discipline** — overlaps `/choir/care`, `HUB_PERMISSIONS`, `CareCaseConsole` discipline gates.

**Completed:** see `03-discipline-summary.md`.

## Legacy alias map

**Do not delete** until all welfare call sites migrated and contract tests pass in CI.
