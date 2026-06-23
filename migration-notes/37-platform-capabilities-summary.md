# Platform scoped capabilities on `/auth/me`

## What changed

- **Backend** resolves three platform auth blobs on every `/auth/me` response (not choir-gated):
  - `protocolAuth` — scope id = default protocol ministry UUID
  - `churchAuth` — scope id `church`
  - `platformAuth` — scope id `platform`
- **`mapPermissionToPlatformCapabilities`** maps legacy permission strings to scoped capability ids (`@ministry`, `@church`, `@platform`).
- **`PlatformCapabilityResolverService`** builds `ResolvedAuth` for each domain; protocol permissions mirror protocol dashboard committee/membership logic.
- **Frontend** stores the three blobs in `usePlatformAuthStore`, hydrated from login/register/me/getProfile/logout-clear.
- **`usePlatformUiCapability`** routes UI registry checks through scoped capabilities when auths are present; falls back to permission-derived capability mapping when not.

## Files

| Area | Key files |
|------|-----------|
| Backend util | `backend/src/common/platform/platform-capability.util.ts` |
| Backend resolver | `backend/src/common/platform/platform-capability-resolver.service.ts` |
| Backend module | `backend/src/common/platform/platform-capability.module.ts` |
| Auth wiring | `backend/src/auth/auth.service.ts`, `auth.module.ts` |
| Web util | `web/lib/platform/platform-capability.util.ts` |
| Web registry | `web/lib/platform/platform-ui-capability-registry.ts` (scoped `requireAnyOf`) |
| Web router | `web/lib/platform/platform-capability-router.ts` |
| Web store | `web/stores/platform-auth.ts` |
| Web hook | `web/lib/hooks/usePlatformCapability.ts` |
| API hydration | `web/lib/api/modules/auth.ts` |

## Tests

```bash
cd backend && npm test -- --testPathPatterns="platform-capability|platform-ui-capability"
```

## Still deferred

- `protocolAuth` on protocol dashboard context endpoint (optional; `/auth/me` is source of truth for UI).
- HTTP guards for protocol/church/system routes using scoped capabilities.
- Remove legacy permission fallback in `usePlatformUiCapability` once auths are always present.
- Mobile parity.
