# Documents / uniforms / equipment (logistics) capability slice

## Capability IDs (v1)

| ID | Purpose |
|---|---|
| `choir.document.view@choir` | List and read choir documents |
| `choir.document.manage@choir` | Upload and create documents |
| `choir.uniform.view@choir` | View uniform inventory and dashboard |
| `choir.uniform.manage@choir` | Create types/items, issue and return uniforms |
| `choir.equipment.view@choir` | View equipment dashboard |
| `choir.equipment.manage@choir` | Create, assign, and return equipment |

## Backend

- `logistics-capability-ids.ts`, `role-logistics-capability-bundles.ts`, `logistics-ui-capability-registry.ts`
- `logistics-capability-resolver.service.ts`, `logistics-capability.module.ts`
- Aliases: `choir.document.manage`, `choir.uniform.manage`, `choir.equipment.manage`
- `logisticsAuth` on `/auth/me?choirId=` and choir dashboard context
- `ChoirLogisticsAccessService` + documents, uniforms, equipment services migrated

## Frontend

- Mirror UI registry, `logistics-routes.ts`, `logistics-nav.ts`
- `useLogisticsAuth`; `choir.document.*` / `choir.uniform.*` / `choir.equipment.*` routed in `useCapability.ts`
- `/choir/documents` → `logistics-documents-hub`; `/choir/assets` → `logistics-assets-hub`
- Manage panels use `logistics-uniform-manage` / `logistics-equipment-manage`

## Tests

- `logistics-capability-can.util.spec.ts`
- `logistics-capability-contract.spec.ts`
- `logistics-nav-page-access-parity.spec.ts`

## Deferred

| Item | Notes |
|------|-------|
| Church-wide asset registry (`asset:*`) | Separate assets module — unchanged |
| `/choir/records` hub | Mixed legacy permissions |
| `care` page document upload | Legacy `PermissionGate` unchanged |

## Next domain candidates

- Devotions / reports / custom roles (remaining choir ops surfaces)
