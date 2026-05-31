# Dark mode

Dark mode is an **optional override**. Light mode is the default on first launch (web and mobile).

## Palette

Aligned with the approved dark-mode mockups (deep navy canvas, elevated cards, electric-blue accents).

| Element | Color |
|---------|-------|
| Background | `#0B0E14` |
| Surface | `#131924` |
| Surface variant | `#1E293B` |
| Border | `#2A3444` |
| Text primary | `#E5E7EB` |
| Text secondary | `#9CA3AF` |
| Primary | `#2563EB` |
| Primary on buttons / active nav | `#FFFFFF` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |

## Behavior

- **Default:** light mode (`defaultTheme="light"` on web; `ThemeMode.light` on mobile)
- User override in **Settings → Appearance** or the header theme toggle (web)
- Persisted in Hive `cache` box (mobile) / `next-themes` local storage (web)

## Coverage

- **Web:** all dashboard, auth, and feature routes inherit tokens via `globals.css` and shared CMMS components (`CmmsCard`, `CmmsButton`, `CmmsTable`, charts, shell).
- **Mobile:** `AppTheme.dark`, tab shell, drawer, and settings appearance picker.

## Contrast

- Semantic colors tuned for dark surfaces while staying recognizable
- Cards use border + subtle shadow — not heavy elevation
- Ministry accents remain visible at 12% opacity backgrounds

## Implementation

**Web** (`web/providers/theme-provider.tsx`):

```tsx
<NextThemesProvider defaultTheme="light" enableSystem attribute="class" />
```

**Mobile** (`mobile/lib/core/design/theme/theme_mode_provider.dart`):

```dart
MaterialApp(
  theme: AppTheme.light,
  darkTheme: AppTheme.dark,
  themeMode: ref.watch(themeModeProvider), // defaults to ThemeMode.light
)
```

Components must use theme tokens — never hardcode light-only colors in features.

See [light_mode_reference.md](light_mode_reference.md) for the primary UI specification.
