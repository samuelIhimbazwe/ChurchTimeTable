# Light mode UI reference

This document captures the **default light-mode** visual language for CMMS.

**For screen layout, features, and navigation:** see [ui_prototype_spec.md](ui_prototype_spec.md) — that is the product UI template derived from the prototype images.

## Design intent

CMMS should feel like a calm **church operating system** — trustworthy, card-based, and data-forward — not fintech or social UI.

**Default theme:** light everywhere. Dark mode remains available as an optional override in Settings / theme toggle.

## Palette (light)

| Token | Value | Usage |
|-------|-------|--------|
| Background | `#F4F6F9` | App canvas |
| Surface | `#FFFFFF` | Cards, header, sidebar |
| Surface muted | `#E8F0FE` | Active nav tint, KPI accents |
| Border | `#E2E8F0` | Card and table borders |
| Primary | `#0056D2` | Buttons, active nav, charts, links |
| Text primary | `#0F172A` | Headings, values |
| Text secondary | `#64748B` | Labels, subtitles |
| Success | `#16A34A` | Active status, approve, positive trend |
| Warning | `#F59E0B` | Pending status |
| Danger | `#DC2626` | Reject, negative trend |
| Info | `#0891B2` | Ministry tags, informational badges |

## Layout patterns

### Desktop web

- **Persistent left sidebar** (~260px): logo, grouped nav with icons, user chip at bottom
- **Top header card**: page title, subtitle, search field, notification icon, profile
- **Content**: card stacks with metric KPI row, two-column analytics, tables below
- **No duplicate page titles** inside feature screens — shell owns the H1

### Mobile web

- Hamburger opens **drawer** with full nav (same items as desktop sidebar)
- Compact header with notification + avatar
- Stacked KPI cards and list rows

### Native mobile

- **Bottom tabs:** Home · Members · Events · More
- **Header:** hamburger (drawer), title, notification bell
- **Drawer (More):** secondary routes (attendance, finance, sync, settings, logout)
- **FAB** on Members tab for primary add action

## Components

| Pattern | Implementation |
|---------|----------------|
| Metric KPI card | `DashboardStatCard` — label, large value, optional trend line |
| Status pill | `CmmsBadge` — success / warning / danger / info / neutral |
| Data table | `CmmsTable` — sticky header, zebra hover, empty state |
| Donut summary | `DonutChart` — conic gradient ring + legend |
| Progress bar | `ProgressMeter` / `DistributionChart` |
| Tabs | `CmmsTabs` — All / Active / Pending / Inactive on members |
| Page chrome | `AppShell` + `Sidebar` + `TopNav` |

## Screen coverage (mockup-aligned)

| Screen | Web route | Notes |
|--------|-----------|-------|
| Dashboard | `/dashboard` | KPI grid, welcome banner, upcoming events |
| Members | `/dashboard/members` | Tabs, search, avatar rows, status badges |
| Pending approvals | `/dashboard/members/pending` | Approve/reject + summary donut |
| Events | `/dashboard/events` | Calendar / list toggle |
| Attendance | `/dashboard/attendance` | KPI cards, overall rate chart |
| Finance | `/dashboard/finance` | Currency metrics, trend chart |
| Governance | `/dashboard/governance` | Role assignment tables |

Not every backend feature has a mockup screen yet (coverage, swaps, admin, etc.). New screens should follow the same tokens and layout rules above.

## Light mode checklist (complete)

- [x] Default theme: light on web and mobile
- [x] Design tokens in `globals.css` and Flutter `colors.dart`
- [x] Shared components use CSS variables (badge, alert, input, button)
- [x] App shell owns page titles; feature screens use cards only
- [x] Auth/marketing pages: split hero + card layout
- [x] i18n: `en`, `fr`, `rw` synced for shell, members, dashboard, auth, coverage
- [x] Mobile tab shell on Home / Members / Events routes

## Governance

- Use CSS variables / design tokens — no hardcoded hex in feature code
- Prefer shared CMMS components over one-off styling
- App shell owns page titles — feature screens use section headings inside cards only
- Auth and error pages use the split hero + card layout
- Pair UI changes with localization updates (`en`, `fr`, `rw`)

## Related docs

- [dark_mode.md](dark_mode.md) — optional dark override
- [components.md](components.md) — Flutter component catalog
- [README.md](README.md) — design system structure
