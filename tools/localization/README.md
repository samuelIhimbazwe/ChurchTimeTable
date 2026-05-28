# CMMS Localization QA Pipeline

Production-grade checks for **Kinyarwanda (rw)**, **English (en)**, and **French (fr)**.

## Quick start

```bash
# From repository root
npm run localization:validate

# Or from this directory
npm run validate
```

## Scripts

| Script | Purpose |
|--------|---------|
| `validate-arb.js` | Missing keys across `app_rw/en/fr.arb` |
| `validate-placeholders.js` | `{placeholder}` parity per key |
| `validate-glossary.js` | Kinyarwanda church term enforcement |
| `validate-backend-i18n.js` | `backend/src/i18n/messages/*.ts` parity |
| `validate-enum-mapping.js` | Prisma enums ↔ `church_localization.dart` |
| `validate-tone-metadata.js` | Tone categories per key prefix |
| `validate-offline.js` | No cloud translation APIs |
| `scan-flutter-strings.js` | Hardcoded `Text("...")` detection |
| `run-all.js` | Runs all checks (CI entry point) |

## Glossary & tone

- `glossary/forbidden_rw.json` — banned English/leaky patterns in rw ARB values
- `glossary/tone-metadata.json` — pastoral / administrative / operational / disciplinary / celebratory
- Human docs: `docs/localization/church_terms_*.md`, `style_guide_rw.md`

## Flutter tests

```bash
cd mobile
flutter test test/localization/
```

## CI

GitHub Actions: `.github/workflows/localization.yml` — fails build on any validation error.

## Suppressing false positives

Add `// l10n-ignore` on a line to skip hardcoded-string scanner (non-user-facing only).

## Developer rule

**Never merge** UI or notification copy without passing `npm run localization:validate`.
