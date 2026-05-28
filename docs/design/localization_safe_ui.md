# Localization-safe UI

## Principles

1. **No fixed-width buttons** — use `CmmsButton` with `expanded: true`
2. **No `Text` with string literals** — use `context.l10n` or `LocalizedText`
3. **No raw API enums in UI** — use `church_localization` mappers
4. **`softWrap: true`** on all user-visible labels
5. **Placeholders in ARB** — never concatenate sentences across languages

## Components built for i18n

- `LocalizedText` — adaptive line height per locale
- `CmmsButton` / `CmmsCard` / `CmmsChip` — dynamic height
- `CmmsDialog` — multiline title + body

## French overflow

French labels are ~20–30% longer. Test at width **100–120px** in widget tests.

## Kinyarwanda

Prefer church glossary terms ([church_terms_rw.md](../localization/church_terms_rw.md)).

Run `npm run localization:validate` before every UI PR.
