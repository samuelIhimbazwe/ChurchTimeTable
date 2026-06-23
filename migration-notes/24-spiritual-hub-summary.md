# Spiritual hub capability slice

## Scope

Migrate remaining `PermissionGate`s on `/choir/spiritual` to unified devotion UI capabilities.

## Legacy aliases added

| Legacy | Capability |
|---|---|
| `choir.intercession.manage` | `choir.devotion.manage@choir` |
| `choir.spiritual.program.manage` | `choir.devotion.publish@choir`, `choir.devotion.manage@choir` |

## UI capabilities

| ID | Legacy gates replaced |
|---|---|
| `devotion-intercession-actions` | `choir.intercession.manage`, `choir.devotion.manage` |
| `devotion-prayer-programs` | `choir.spiritual.program.manage`, `choir.devotion.manage` |

Devotions tab already used `devotion-spiritual-content` / `devotion-publish-form` (unchanged).

## Frontend

- `spiritual/page.tsx` — intercession buttons + programs tab off `PermissionGate`

## Tests

- `spiritual-devotion-ui-capability.spec.ts`
- Registry sync via `devotion-capability-contract.spec.ts`

Run: `cd backend && npm test -- --testPathPatterns="spiritual-devotion|devotion-capability"`

## Deferred

- `role-nav.ts` `HUB_PERMISSIONS` for `/choir/spiritual`
- `activities/new/page.tsx` activity create gate
- `family-head/page.tsx` unused import cleanup
- Other scattered `PermissionGate`s (assets, president console, protocol)
