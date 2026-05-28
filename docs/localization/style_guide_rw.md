# Ikinyarwanda localization style guide (CMMS)

Canonical tone and wording rules for **native** Kinyarwanda UX.

## 1. Tone categories

| Tone | Use when | Example domains |
|------|----------|-----------------|
| **Pastoral** | Care, worship, encouragement | Iteraniro, announcements |
| **Administrative** | Settings, auth, finance records | Igenamiterere, imeri |
| **Operational** | Schedules, assignments, sync | Gahunda, guhuza |
| **Disciplinary** | Imyitwarire cases | Formal, careful, no blame language |
| **Celebratory** | Korali, success confirmations | Warm, community-focused |

## 2. Voice & grammar

- Prefer **clear church Kinyarwanda**, not dictionary English order.
- Use **full sentences** in notifications with placeholders (`{memberName}`, `{eventName}`).
- Avoid slang; avoid overly bureaucratic Kinyarwanda government tone.
- **Do not concatenate** translated fragments — one ARB string per message.

## 3. Capitalization

- Module titles: sentence case (e.g. `Uko witabiriye`, not `UKO WITABIRIYE`).
- Proper nouns: `Korali`, `Protocol`, names of people.
- Status chips: short label, no period at end.

## 4. Church vocabulary (mandatory)

See [church_terms_rw.md](church_terms_rw.md). QA enforces:

- **Uko witabiriye** — not standalone “Kwitabira” for the module
- **Gusimburana** — not “Guhindurana” for swaps
- **Imyitwarire** — not “Indangagaciro” for discipline
- **Gusimbura** — replacements

## 5. Notifications

- Title: short (2–4 words), operational tone.
- Body: one complete thought with placeholders.
- Good: `{memberName} yasabye ko musimburana`
- Bad: `Swap request` (English leakage)

## 6. Discipline (Imyitwarire)

- Neutral, respectful wording — describe process, not character.
- Use stage labels: `Byatangajwe`, `Birasuzumwa`, `Icyemezo gitegerejwe`.
- Never shame the member in system copy.

## 7. Finance

- Use **Imari ya Korali** for choir money context.
- Amounts: `Asigaye: {amount}` — currency format from locale layer, not ARB.

## 8. What QA rejects

- English words in `app_rw.arb` values (`attendance`, `swap`, `discipline`)
- Mismatched `{placeholders}` across rw/en/fr
- Missing keys in any locale
- Hardcoded `Text("...")` in Flutter widgets

## 9. Developer workflow

1. Add term to glossary markdown if new church concept.
2. Add semantic key to **all three** ARB files.
3. Run `npm run validate` in `tools/localization/`.
4. Use `context.l10n` / `church_localization` enum mappers — never raw API enums in UI.
