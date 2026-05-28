# Components

Import from:

```dart
import 'package:cmms_mobile/core/design/design.dart';
```

## Buttons

**`CmmsButton`** — multiline-safe, full-width by default.

```dart
CmmsButton(
  label: l10n.attendance_save_action,
  onPressed: _save,
  variant: CmmsButtonVariant.primary,
);
```

## Cards

| Component | Purpose |
|-----------|---------|
| `CmmsCard` | Generic title/subtitle card |
| `MinistryCard` | Ministry-accent navigation |
| `MinistryGridTile` | Leader dashboard grid |
| `ChoirMemberCard` | Member stats |

## Chips

| Component | Purpose |
|-----------|---------|
| `CmmsChip` | Generic accent chip |
| `AttendanceStatusChip` | Present / absent / late / excused |

## Lists & events

| Component | Purpose |
|-----------|---------|
| `EventTile` | Calendar / event lists |
| `CmmsListTile` | Multiline list rows |

## Banners

**`DisciplineBanner`** — tone: `warning`, `suspension`, `underReview`, `info`.

## Dialogs

**`CmmsDialog.confirm`** — stacked full-width actions for long translations.

## Ministry accents

Use `CmmsMinistry` + `MinistryAccents.colorFor()` for icons/chips only — not full-screen backgrounds.
