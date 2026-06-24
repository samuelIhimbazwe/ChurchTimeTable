# Choir-scoped HTTP guards — wave 4 (welfare & music)

## Scope

`WelfareHttpAccessService`, `MusicHttpAccessService`, and migration of welfare/music controllers.

## Registry

- **`welfare-desk`** / **`welfare-case-detail`** / **`welfare-care-inbox`** — now accept `choir.welfare.manage@choir` as well as view

## Backend HTTP

| Controller | Read routes | Mutations |
|------------|-------------|-----------|
| `welfare.controller` | `welfare-desk`, `welfare-case-detail`, `welfare-care-inbox` | `welfare-manage` |
| `music.controller` | `music-library-hub` | `music-library-manage` |

## Deferred

- Finance controller
- Rehearsals, operations, devotions
- Mobile parity

## Tests

```bash
cd backend && npm test -- --testPathPatterns="welfare-http-access|music-http-access|welfare-capability-contract|music-capability"
cd backend && npm run build
```
