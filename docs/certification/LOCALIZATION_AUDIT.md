# Localization Certification Audit

**Date:** 2026-05-31  
**Locales:** English (`en`), French (`fr`), Kinyarwanda (`rw`)

## Web (`web/messages/{en,fr,rw}.json`)

| Namespace | en | fr | rw |
|-----------|----|----|-----|
| `welfare` | ✅ | ✅ | ✅ |
| `music` | ✅ | ✅ | ✅ |
| `rehearsals` | ✅ | ✅ | ✅ |
| `choirReports` | ✅ | ✅ | ✅ |
| `choirDocuments` | ✅ | ✅ | ✅ |
| `choirMeetings` | ✅ | ✅ | ✅ |
| `choirUniforms` | ✅ | ✅ | ✅ |
| `choirEquipment` | ✅ | ✅ | ✅ |
| `search.groups.*` (choir) | ✅ | ✅ | ✅ |
| `shell.nav*` (choir nav) | ✅ | ✅ | ✅ |

**Policy:** Choir UI strings use `next-intl` keys only — no hardcoded English in choir feature components.

## Mobile (`mobile/lib/l10n/app_{en,fr,rw}.arb`)

| Key block | en | fr | rw |
|-----------|----|----|-----|
| Welfare choir keys | ✅ | ✅ | ✅ (this sprint) |
| Music choir keys | ✅ | ✅ | ✅ |
| Rehearsals choir keys | ✅ | ✅ | ✅ |
| Search choir groups | ✅ | ✅ | ✅ |
| Common (back/next/retry) | ✅ | ✅ | ✅ |

**Generated file:** `app_localizations.dart` patched for en/fr/rw catalog entries.

**Action required locally:**

```bash
cd mobile && flutter gen-l10n
```

Run after any ARB change to regenerate official Flutter l10n (CI should enforce).

## Backend i18n (`backend/src/i18n/messages/{en,fr,rw}.ts`)

Welfare/rehearsal notification keys present for all three locales.

## Gaps / follow-ups

| Item | Severity |
|------|----------|
| Mobile `search_title` missing in fr/rw ARB (uses en via fallback in some builds) | Low — add if search screen localized end-to-end |
| Playwright overflow tests for long French labels | Medium |
| PDF export strings — verify server-side i18n on welfare/choir PDFs | Medium |

## Certification verdict

**Web choir namespaces:** ✅ Complete (en/fr/rw)  
**Mobile choir keys:** ✅ Complete (en/fr/rw) — run `flutter gen-l10n` to sync generated code  
**No English fallbacks in choir web namespaces:** ✅ Verified for primary screens
