# Offline Support Matrix — Choir Module

**Storage:** Hive box `choir_offline_v1` (`ChoirOfflineRepository`)

## Welfare

| Action | Offline read | Offline write | Sync on reconnect |
|--------|--------------|---------------|-------------------|
| Dashboard stats | ✅ Cached | ❌ | Pull-to-refresh |
| Case list | ✅ Cached | ❌ | Pull-to-refresh |
| Case detail | ✅ Cached | ❌ | Pull-to-refresh |
| Timeline | ❌ (requires network) | ❌ | — |
| Create case | ❌ | ❌ | — |
| Contribute | ❌ | ❌ | — |
| Record assistance | ❌ | ❌ | — |
| Reports | ❌ | ❌ | — |

## Music

| Action | Offline read | Offline write | Sync on reconnect |
|--------|--------------|---------------|-------------------|
| Song list | ✅ Cached | ❌ | Pull-to-refresh |
| Song detail + lyrics | ✅ Cached | ❌ | Open detail when online first |
| Favorites list | ✅ Cached | ❌ | Pull-to-refresh |
| Toggle favorite | ❌ | ❌ | — |
| Asset preview (PDF/audio) | ⚠️ URL only if previously loaded | ❌ | — |

## Rehearsals

| Action | Offline read | Offline write | Sync on reconnect |
|--------|--------------|---------------|-------------------|
| Dashboard / upcoming | ✅ Cached | ❌ | Pull-to-refresh |
| Plan per event | ✅ Cached | ❌ | Pull-to-refresh |
| Attendance list | ❌ | ❌ | — |
| Mark attendance | ❌ | ❌ | — |
| Section readiness | ❌ | ❌ | — |

## Unsupported offline (by design for MVP)

- Welfare case creation/editing
- Leadership approval workflows
- PDF/CSV exports
- Push notifications delivery
- Search (requires API)

## Future enhancement

Wire `SyncService` queue for queued welfare contributions and attendance marks when connectivity returns.
