# CMMS Localization & Church Terminology

This folder is the **master glossary** for native multilingual UX (Kinyarwanda-first).

## Files

| File | Purpose |
|------|---------|
| [church_terms_rw.md](church_terms_rw.md) | Kinyarwanda church-native vocabulary (canonical) |
| [church_terms_en.md](church_terms_en.md) | English reference labels |
| [church_terms_fr.md](church_terms_fr.md) | French reference labels |

## Rules for developers

1. **Never** invent new Kinyarwanda church terms in code — add them here first, then to `mobile/lib/l10n/app_*.arb`.
2. Use **semantic keys** (`member_attendance_label`, not `attendance`).
3. Dynamic text must use **ARB placeholders** (`{memberName}`, `{eventName}`) — no string concatenation across languages.
4. Backend push notifications use the same message keys in `backend/src/i18n/messages/`.
5. Default locale: **Kinyarwanda (`rw`)**.

## Flutter usage

```dart
context.l10n.swap_request_sent(memberName);
context.l10n.swapStatusLabel('REQUESTED');
```

See `mobile/lib/core/localization/church_localization.dart`.

## Quality assurance

- Style guide: [style_guide_rw.md](style_guide_rw.md)
- Automated pipeline: `tools/localization/` — run `npm run localization:validate` from repo root
- CI: `.github/workflows/localization.yml`
