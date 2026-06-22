# Voice sections capability slice

## Capability IDs (v1)

| ID | Purpose |
|---|---|
| `choir.voice.view@choir` | List choir voice sections (read-only) |

## Backend

- `voice-capability-ids.ts`, `role-voice-capability-bundles.ts`, `voice-ui-capability-registry.ts`
- `voice-capability-resolver.service.ts`, `voice-capability.module.ts`
- Aliases: `choir.music.view`, `choir.music.manage`, `choir.rehearsal.view`, `choir.rehearsal.manage`, `event:read`
- `voiceAuth` on `/auth/me?choirId=` and choir dashboard context
- `ChoirVoiceAccessService` + `rehearsals.service.ts` `listVoiceSections` migrated

## Frontend

- Mirror UI registry, `voice-routes.ts`, `voice-nav.ts`
- `useVoiceAuth`; `choir.voice.*` routed in `useCapability.ts`
- `/choir/voice-sections` → `voice-sections-hub`

## Tests

- `voice-capability-can.util.spec.ts`
- `voice-capability-contract.spec.ts`
- `voice-nav-page-access-parity.spec.ts`

## Deferred

| Item | Notes |
|------|-------|
| Voice section CRUD | Seed-only in v1; no manage capability |
| Hub quick links on music-direction | Gated indirectly via page gate when navigating |
| Documents / uniforms / equipment | Next logistics slice |

## Next domain candidates

- Documents / uniforms / equipment (logistics)
