# Playwright Web Certification Report

**Date:** 2026-05-31  
**Config:** `web/playwright.config.ts` (base URL `http://localhost:3001`, Edge channel)

## Required coverage map

| Domain | Spec file | Status |
|--------|-----------|--------|
| Contributions | `contribution-center.spec.ts`, `my-contributions.spec.ts`, `family-contributions.spec.ts` | Present |
| Families | `families` via navigation / member flows | Partial — use `navigation-permissions.spec.ts` |
| Welfare | `welfare.spec.ts` | Present |
| Music | `music.spec.ts` | Present |
| Rehearsals | `rehearsals.spec.ts` | Present |
| Choir reports | `choir-reporting.spec.ts` | Present |
| Search | `search-dropdown.spec.ts` | Present |
| Permissions | `navigation-permissions.spec.ts` | Present |
| Phone enforcement | `phone-enforcement.spec.ts` | Present |
| Mobile layouts | `ux-shell.spec.ts`, `visual-regression.spec.ts` | Partial |

## Run instructions

```bash
# Terminal 1 — API
cd backend && npm run start:dev

# Terminal 2 — Web
cd web && npm run dev

# Terminal 3 — Playwright
cd web && npx playwright test
```

Choir smoke (subset):

```bash
npx playwright test welfare.spec.ts music.spec.ts rehearsals.spec.ts choir-reporting.spec.ts
```

## Certification status

| Check | Status |
|-------|--------|
| Spec files exist for choir domains | ✅ |
| Automated run in CI this sprint | ⚠️ Not executed (requires live servers) |
| Mobile viewport projects | ⚠️ Add `devices['Pixel 5']` / `iPad` projects for full tablet/phone certification |
| Dark mode suite | ⚠️ Not yet dedicated — extend `visual-regression.spec.ts` |
| Localization overflow | ⚠️ Add `tests/localization-overflow.spec.ts` with `fr`/`rw` locale routes |

## Recommended next steps

1. Add Playwright `webServer` block to start API + Next automatically in CI.
2. Add viewport projects for phone (390×844) and tablet (768×1024).
3. Add locale parameter tests: `/fr/dashboard/welfare`, `/rw/dashboard/music`.
