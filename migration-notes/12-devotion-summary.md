# Devotions capability slice

## Capability IDs (v1)

| ID | Purpose |
|---|---|
| `choir.devotion.view@choir` | Read published devotions, bookmarks, widget |
| `choir.devotion.create@choir` | Draft new devotions |
| `choir.devotion.publish@choir` | Publish devotions to members |
| `choir.devotion.manage@choir` | Full manage list, edit, pin |

## Backend

- `devotion-capability-ids.ts`, `role-devotion-capability-bundles.ts`, `devotion-ui-capability-registry.ts`
- `devotion-capability-resolver.service.ts`, `devotion-capability.module.ts`
- Aliases: `choir.devotion.view`, `.create`, `.publish`, `.manage`
- `devotionAuth` on `/auth/me?choirId=` and choir dashboard context
- `ChoirDevotionAccessService` + `devotions.service.ts` migrated

## Frontend

- Mirror UI registry, `devotion-routes.ts`, `devotion-nav.ts` (nav no-op — spiritual hub shared)
- `useDevotionAuth`; `choir.devotion.*` routed in `useCapability.ts`
- Devotions tab on `/choir/spiritual` gated with `devotion-spiritual-content` / `devotion-publish-form`

## Tests

- `devotion-capability-can.util.spec.ts`
- `devotion-capability-contract.spec.ts`
- `devotion-nav-page-access-parity.spec.ts`

## Deferred

| Item | Notes |
|------|-------|
| Full `/choir/spiritual` page gate | Intercession/program tabs use legacy perms |
| Reports slice | `choir.reports.view` already aliases to `choir.ops.view@choir` |
| Custom roles slice | `choir.custom_role.manage` — separate |

## Next domain candidates

- Custom roles / committee role management
- Reports export surfaces (if not fully covered by ops)
