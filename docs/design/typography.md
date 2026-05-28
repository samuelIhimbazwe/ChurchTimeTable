# Typography

## Font stack

- **Primary:** Inter (via theme `fontFamily`)
- **Fallback:** Noto Sans (loaded for full Kinyarwanda + French glyph coverage)

## Hierarchy

| Role | Token | Use |
|------|-------|-----|
| Screen title | `titleLarge` | AppBar |
| Section | `titleMedium` | Card titles |
| Body | `bodyMedium` | Paragraphs, list subtitles |
| Label | `labelLarge` | Buttons |
| Caption | `bodySmall` | Metadata, hints |

## Line height (localization-aware)

| Locale | Multiplier | Reason |
|--------|------------|--------|
| `rw` | 1.45 | Long compound phrases |
| `fr` | 1.40 | Accents + longer words |
| `en` | 1.35 | Baseline |

Applied via `LocalizedText` and `CmmsTypography.adaptiveLineHeight`.

## Rules

- Never set fixed `height` on buttons without `softWrap: true`
- Use `LocalizedText` for user-facing copy
- Support system text scaling (clamped 0.9–1.4 in `main.dart`)
