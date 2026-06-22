# Migration summary — discipline capability slice

## What changed

### Backend
- **Capability IDs:** `discipline-capability-ids.ts` (`view@choir`, `manage@choir`, `review@choir`)
- **Alias map:** `discipline:read_all`, `discipline:manage`, `discipline.review` → capability IDs
- **Role bundles:** `role-discipline-capability-bundles.ts`
- **UI registry:** `discipline-ui-capability-registry.ts`
- **Resolver:** `discipline-capability-resolver.service.ts` + `discipline-capability.module.ts`
- **`/auth/me?choirId=`** and **choir dashboard context** include `disciplineAuth`
- **`discipline.service.ts`** — create/advance/list/find use capability resolver + `getActiveChoirId()`

### Frontend
- **`discipline-ui-capability-registry.ts`** (mirrors backend)
- **`discipline-nav.ts`** — nav overrides for `/choir/discipline`
- **`useCapability` hooks** — discipline UI caps + `choir.discipline.*` route to `disciplineAuth`
- **Pages:** `discipline`, care hub discipline tab (manage gate)
- **Bonus fix:** care hub welfare tab create gate now uses `welfare-manage` only (removed erroneous `discipline:manage` OR)

### Tests
- `discipline-capability-can.util.spec.ts`
- `discipline-capability-contract.spec.ts`
- `discipline-nav-page-access-parity.spec.ts`

## Deliberately left untouched

| Area | Why |
|------|-----|
| `/choir/care` page-level gate | Mixed care hub (rules, welfare, discipline, notices) |
| `HUB_PERMISSIONS` `/choir/care` | Mixed permissions; per-tab gates migrated where clear |
| `choir/page.tsx` discipline KPI / ops tiles | Legacy mixed gates |
| `advisor` page discipline tiles | Legacy permission checks |
| `choir-capability-registry` old `discipline` tile | Legacy registry; UI registry is source for new gates |
| Alias map deletion / full nav restructure | Retention policy unchanged |

## Suggested next domain

**Scheduling / operations** or **join-requests** — fewer cross-domain overlaps than care hub cleanup.

## Legacy alias map

**Do not delete** until all discipline call sites migrated and contract tests pass in CI.
