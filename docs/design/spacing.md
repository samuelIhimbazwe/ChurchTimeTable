# Spacing

## Scale (4pt base)

| Token | px | Use |
|-------|-----|-----|
| `xxs` | 4 | Tight inline gaps |
| `xs` | 8 | Chip spacing, icon gaps |
| `sm` | 12 | Card internal |
| `md` | 16 | Screen padding (default) |
| `lg` | 24 | Section separation |
| `xl` | 32 | Major sections |
| `xxl` | 48 | Rare hero spacing |

## Responsive

- **Compact** (&lt;360px): screen padding `sm` (12px)
- **Default**: `md` (16px)

Use `AdaptiveSpacing.screen(context)` — never hardcode `EdgeInsets.all(16)` in features.

## Layout

- Scroll-safe: prefer `ListView` / `CustomScrollView` over nested unbounded columns
- Grid leader dashboard: `childAspectRatio: 1.05` for multiline labels
