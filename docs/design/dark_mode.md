# Dark mode

## Palette

| Element | Color |
|---------|-------|
| Background | `#0F172A` |
| Surface | `#1E293B` |
| Surface variant | `#334155` |
| Text primary | `#F8FAFC` |
| Text secondary | `#CBD5E1` |
| Primary (adjusted) | `#3B5CB8` |

## Behavior

- `ThemeMode.system` default (follows device)
- User override in **Settings → Appearance**
- Persisted in Hive `cache` box

## Contrast

- Semantic colors (success, warning, danger) unchanged for recognition
- Cards use border + subtle shadow — not heavy elevation
- Ministry accents remain visible at 12% opacity backgrounds

## Implementation

```dart
MaterialApp(
  theme: AppTheme.light,
  darkTheme: AppTheme.dark,
  themeMode: ref.watch(themeModeProvider),
)
```

Components must use `Theme.of(context)` — never hardcode light-only colors in features.
