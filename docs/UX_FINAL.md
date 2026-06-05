# UX-FINAL-1 — Leadership Experience & QA Stabilization

## Delivered

### Role action centers (web)

Purpose-built panels wired to live APIs:

| Role | Component | Data sources |
|------|-----------|--------------|
| Choir president | `ChoirPresidentActionCenter` | `GET /choirs/join-requests`, `GET /choir/scheduling/dashboard` |
| Protocol coordinator | `ProtocolCoordinatorActionCenter` | `GET /protocol/dashboard`, `GET /protocol/claims` |
| Protocol team leader | `ProtocolTeamLeaderActionCenter` | `GET /protocol/dashboard/team-leader` |

Integrated on:

- Leader dashboard (`/dashboard/leader`)
- Choir operations hub (`/dashboard/choir`)
- Protocol overview (`/dashboard/protocol`)

### Church branding

- `ChurchBrandingProvider` loads `GET /church/public/branding` globally
- Primary color applied as CSS `--primary`
- Logo and church name on sidebar, login, and register via `ChurchBrandMark` / `BrandedGuestAside`

### Localization (EN / FR / RW)

New namespaces: `actionCenter`, `memberPortal`, `choirDiscovery`, `protocolDiscovery`, `protocolOps`, plus synced `landing` and `onboarding.signup` in FR/RW.

Portal pages localized:

- Member home dashboard
- `/choirs`, `/protocol` discovery
- Protocol operations tabs and overview stats

### Accessibility

Action center regions use `role="region"`, `aria-labelledby`, `aria-busy`, and alert roles for errors.

### E2E

- `backend/test/member-onboarding.e2e-spec.ts` — signup, portal, choir join, protocol claim, onboarding complete, branding
- `backend/test/dashboard-workflow.e2e-spec.ts` — leader, choir scheduling, join review, protocol dashboards, claims

Run:

```bash
cd backend
npm run test:e2e -- member-onboarding.e2e-spec.ts dashboard-workflow.e2e-spec.ts
```

## Pilot QA checklist

- [ ] Sign in as choir president — action center shows pending join requests
- [ ] Sign in as protocol leader — coordinator action center shows claims/replacements
- [ ] Switch locale FR/RW on login, register, member portal — no English-only blocks
- [ ] Confirm church logo/name on sidebar and auth pages
- [ ] Resize to mobile — action centers stack; sidebar menu works
- [ ] Complete new member signup → member home → discover choirs → submit request

## Responsive UX

Action center grids use `sm:grid-cols-2` / `xl:grid-cols-2` layouts. Full responsive Playwright suite is optional follow-up; API E2E covers workflow integrity.
