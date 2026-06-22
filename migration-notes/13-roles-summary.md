# Custom / committee roles capability slice

## Capability IDs (v1)

| ID | Purpose |
|---|---|
| `choir.custom_role.manage@choir` | CRUD choir custom roles and assignments |
| `choir.committee_role.manage@choir` | Committee position templates, SoD, advisor elevations |

## Backend

- `roles-capability-ids.ts`, `role-roles-capability-bundles.ts`, `roles-ui-capability-registry.ts`
- `roles-capability-resolver.service.ts`, `roles-capability.module.ts`
- Aliases: `choir.custom_role.manage`, `committee.role.manage`
- `rolesAuth` on `/auth/me?choirId=` and choir dashboard context
- `ChoirRolesAccessService` + `choir-custom-roles.service.ts`, choir governance role methods migrated

## Frontend

- Mirror UI registry, `roles-routes.ts`, `roles-nav.ts`
- `useRolesAuth`; `choir.custom_role.*` / `choir.committee_role.*` routed in `useCapability.ts`
- `/choir/roles` → `roles-hub`; manage UI → `roles-committee-manage`

## Tests

- `roles-capability-can.util.spec.ts`
- `roles-capability-contract.spec.ts`
- `roles-nav-page-access-parity.spec.ts`

## Deferred

| Item | Notes |
|------|-------|
| `committee.member.manage` | Committee seat assignment — separate slice |
| Admin hub `PermissionGate` links | Legacy gates on executive/admin hubs unchanged |
| `/choir/admin` page | Mixed permissions |

## Next domain candidates

- Committee member assignment (`committee.member.manage`)
- Reports export surfaces (mostly covered by ops)
