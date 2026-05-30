# CMMS Web Design System (Sprint 9 / 9.1)

The approved ministry color palette lives in `web/app/globals.css`. Sprint 9 refines **spacing, typography, hierarchy, and components** — not brand colors. Sprint 9.1 completes **operational screen refinement** (modals, empty states, Storybook, QA).

## Tokens

| Layer | Location |
|-------|----------|
| CSS variables (colors, radius, motion) | `web/app/globals.css` |
| TS re-exports (spacing, layout class names) | `web/core/design/tokens.ts` |

Utility classes:

- `.cmms-text-display` / `.cmms-text-title` / `.cmms-text-heading` / `.cmms-text-body` / `.cmms-text-caption` / `.cmms-text-label`
- `.cmms-page-stack` — vertical page rhythm (`--space-section`)
- `.cmms-section-stack` — section internal gap
- `.cmms-content-narrow` — readable form width
- `.cmms-interactive` — subtle hover/focus transitions

## Components (`web/components/ui/`)

| Component | Use |
|-----------|-----|
| `CmmsButton` | Actions |
| `CmmsCard` | Grouped content |
| `CmmsTable` | Data lists (sticky header, scroll) |
| `CmmsBadge` | Status |
| `CmmsEmptyState` | Intentional empty UX |
| `CmmsSkeleton` / `CmmsDashboardSkeleton` | Loading |
| `CmmsPageSection` | Dashboard sections |
| `CmmsFormField` | Form labels + errors (wrap `CmmsInput` / `CmmsSelect`) |
| `CmmsSelect` | Styled selects inside form fields |
| `CmmsAlert` | Inline error/success/info messages |
| `CmmsTabs` | Segmented control |
| `CmmsModal` / `CmmsDialog` | Dialogs |
| `OperationalScreen` | Page shell for dense operational routes |

**Rule:** Prefer these over ad-hoc styled `div`s for new UI.

## Operational screens (Sprint 9.1)

These routes use `OperationalScreen` + design-system components:

- Attendance governance
- Event engine
- Coverage management
- Committee governance admin
- Finance stewardship + My contributions

## Shell navigation

Workflow groups in `getShellNavigationGroups()`:

1. **Today** — Dashboard  
2. **My ministry** — My contributions  
3. **Operations** — Events, operational center, attendance, coverage  
4. **Stewardship** — Finance (scoped)  
5. **Governance** — Committee admin  
6. **Administration** — Super admin  

## QA

- `npm run ui:qa` — bans deprecated inline color classes in `features/`; verifies design-system usage on dense screens
- Playwright (requires backend + web running):
  - `web/tests/ux-shell.spec.ts` — shell nav groups
  - `web/tests/ux-refinement.spec.ts` — attendance tabs, events, governance, operational center
  - `web/tests/dashboard-shell.spec.ts` — dashboard layout
- Visual baselines (opt-in): `CMMS_VISUAL_BASELINE=1 npx playwright test visual-regression --update-snapshots`
- Before merge: `npm run build` and `npm run ui:qa` in `web/`

### Running Playwright locally

```bash
# Terminal 1 — backend (port 3000)
cd backend && npm run start:dev

# Terminal 2 — web (port 3001)
cd web && npm run dev

# Terminal 3 — tests
cd web && npx playwright test ux-refinement
cd web && CMMS_VISUAL_BASELINE=1 npx playwright test visual-regression --update-snapshots
```

Pilot password: `Pilot@123` (admin: `Admin@123`).

## Storybook

```bash
cd web
npm install
npm run storybook
```

Stories live in `web/stories/CmmsComponents.stories.tsx`. Covers buttons, badges, alerts, cards, empty states, forms, tabs, tables, skeletons, dialogs, and `OperationalScreen`.

## i18n

Locale files: `web/messages/en.json`, `fr.json`, `rw.json`. Finance (`financeStewardship`, `myContributions`) and governance admin keys are mirrored across all three locales.

## Dark mode

Refined surfaces in `.dark` — softer background (`#0b1220`), clearer borders. Toggle via `ThemeToggle`.
