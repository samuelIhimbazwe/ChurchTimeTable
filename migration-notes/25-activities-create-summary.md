# Activities create page capability slice

## Scope

Migrate `/choir/activities/new` from legacy `PermissionGate` to `ops-activities-manage` UI capability (already used on activities list page).

## Legacy permissions replaced

| Legacy | Capability (via alias) |
|---|---|
| `choir.events.manage` | `choir.ops.manage@choir`, `choir.meeting.manage@choir` |
| `event:write` | `choir.ops.manage@choir` |

## Fix

Removed duplicate `choir.events.manage` alias entry (second definition wins in JS).

## Frontend

- `activities/new/page.tsx` → `CapabilityGate uiCapability="ops-activities-manage"`

## Tests

- `ops-activities-create.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="ops-activities-create"`

## Deferred

- `role-nav.ts` `HUB_PERMISSIONS` hub paths (spiritual, budget, records, …)
- Assets panel, president console, protocol gates
- `family-head/page.tsx` unused import
