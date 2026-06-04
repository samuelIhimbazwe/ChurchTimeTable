# Accessibility Certification Report

**Target:** WCAG 2.1 AA (pragmatic checklist for choir MVP)  
**Date:** 2026-05-31

## Keyboard navigation

| Area | Finding | Status |
|------|---------|--------|
| Modals (`CmmsModal`) | Escape closes; focus trap basic | ✅ |
| Event rehearsal workspace | Tab through plan/attendance forms | ✅ |
| Shell navigation | Top nav + sidebar reachable | ✅ |
| Data tables | Row actions via buttons (not div-only) | ✅ |

## Screen readers

| Area | Finding | Status |
|------|---------|--------|
| Search input | `sr-only` label in `search-dropdown.tsx` | ✅ |
| Form fields | `CmmsFormField` + `htmlFor` on choir forms | ✅ |
| Icon-only buttons | Review remaining event calendar chips | ⚠️ Add `aria-label` where icon-only |

## Visual

| Check | Status |
|-------|--------|
| Focus rings on `CmmsButton` / inputs | ✅ Theme tokens |
| Color contrast (light/dark) | ✅ CSS variables — spot-check in both themes |
| Scalable text | ✅ rem-based typography |

## Mobile

| Check | Status |
|-------|--------|
| Touch targets (ListTile, FilledButton) | ✅ Material defaults |
| Offline banner readable | ✅ |

## Recommended automated follow-up

- Add `@axe-core/playwright` to welfare/music/rehearsals specs
- Run Lighthouse accessibility on `/dashboard/welfare`, `/dashboard/music`, `/dashboard/rehearsals`

## Verdict

**Manual checklist:** Pass with minor icon-only label gaps  
**Automated axe:** Not run this sprint — schedule before production lock
