# Auth UX (AUTH-UX-1)

Church-member-first registration, login copy, welcome landing, member portal default home, choir/protocol discovery, onboarding, and friendly error handling.

## Registration

Four-step signup (web):

1. Account information (name, email, phone, password)
2. Church relationship (existing, new, visitor, returning)
3. Interests only (choir, protocol, ministries — no membership granted)
4. Review and create account

API: `POST /auth/register` with `churchRelationship`, `interests[]`, optional `relationshipNotes`. Members default to `ministry: BOTH` with `NEW_MEMBER` status pending leader approval.

## Public pages

| Route | Purpose |
|-------|---------|
| `/welcome` | Unauthenticated church landing |
| `/login` | Welcome Back sign-in |
| `/register` | Church member signup |
| `/dashboard/member` | Default home for approved members |
| `/choirs` | Choir discovery and join requests |
| `/protocol` | Protocol ministry info and membership claims |

## Public APIs

- `GET /api/v1/church/public/welcome`
- `GET /api/v1/church/public/branding`
- `GET /api/v1/church/public/choirs`
- `POST /api/v1/church/public/analytics` (guest events)
- `POST /api/v1/analytics/ux` (authenticated events)

## Branding

Stored in `ChurchConfiguration.churchInfo.branding` (logo, cover, primary color, welcome message). Admin update via `PATCH /api/v1/church/branding`.

## Tests

```bash
cd backend
npx jest --config ./test/jest-e2e.json auth-ux.e2e-spec.ts --runInBand --forceExit
```

See also: `MEMBER_EXPERIENCE.md`, `CHOIR_DISCOVERY.md`, `PROTOCOL_DISCOVERY.md`, `DASHBOARD_UX.md`.
