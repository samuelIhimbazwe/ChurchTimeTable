# Operations / scheduling capability slice

## Capability IDs (v1)

| ID | Purpose |
|---|---|
| `choir.ops.view@choir` | Read calendar, activities list, service prep |
| `choir.ops.manage@choir` | Create activities, edit service prep, full ops |
| `choir.ops.schedule@choir` | Confirm/decline assignments, schedule plans |
| `choir.ops.attendance@choir` | Record attendance |

## Backend

- `ops-capability-ids.ts`, `role-ops-capability-bundles.ts`, `ops-ui-capability-registry.ts`
- `ops-capability-resolver.service.ts`, `ops-capability.module.ts`
- Aliases in `capability-alias-map.ts` for `choir.ops.*`, `choir.rehearsal.*`, `event:write`, etc.
- `opsAuth` on `/auth/me?choirId=` and `ChoirDashboardContextService`
- `ChoirOpsAccessService` — choir-scoped checks with legacy fallback when `choirId` absent
- Scheduling services + `ServicePreparationService` migrated to `ChoirOpsAccessService`

## Frontend

- Mirror UI registry in `web/lib/choir/ops-ui-capability-registry.ts`
- `ops-routes.ts`, `ops-nav.ts` — nav parity for `/choir/scheduling`, `/choir/activities`, `/choir/service-preparation`
- `useOpsAuth`, routing in `useCapability.ts`
- `composeOpsAwareNav` in `Sidebar.tsx`
- Page gates: scheduling, activities, service-preparation (+ manage panel on detail page)

## Tests

- `ops-capability-can.util.spec.ts`
- `ops-capability-contract.spec.ts`
- `ops-nav-page-access-parity.spec.ts`

## Deferred (do not delete legacy structures)

| Item | Notes |
|------|-------|
| `choir-nav.ts` ops section | Legacy permission checks for roster, overview |
| `/choir/members` roster nav | Member domain — out of slice |
| `/choir` overview tile | Mixed legacy gates on `choir/page.tsx` |
| `choir-capability-registry.ts` operations tile | Legacy tile registry |
| Rankings/reports routes | Backend uses ops caps via aliases; no dedicated UI registry routes yet |

## Next domain candidates

- Join requests (`choir.join.review`)
- Music / rehearsal (partial overlap with ops aliases)
