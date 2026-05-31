# CMMS Design System

A calm, trustworthy, **church operating system** visual language — not fintech or social UI.

## Structure

```
mobile/lib/core/design/
├── tokens/       colors, spacing, typography, radius, shadows, ministry accents
├── theme/        light + dark Material 3 themes
├── components/   buttons, cards, chips, banners, dialogs, lists
└── layout/       responsive, adaptive spacing, LocalizedText
```

## Quick start

```dart
import 'package:cmms_mobile/core/design/design.dart';
```

## Documentation

- [ui_prototype_spec.md](ui_prototype_spec.md) — **UI template spec** (screens, layout, features from prototype images)
- [light_mode_reference.md](light_mode_reference.md) — color tokens and component mapping
- [typography.md](typography.md)
- [spacing.md](spacing.md)
- [components.md](components.md)
- [localization_safe_ui.md](localization_safe_ui.md)
- [dark_mode.md](dark_mode.md)

## Governance

- Use design tokens — no inline `Color(0xFF...)` in features
- Use `CmmsButton`, `CmmsCard`, etc. — no duplicate patterns
- Pair with [localization QA](../localization/README.md) on every PR
