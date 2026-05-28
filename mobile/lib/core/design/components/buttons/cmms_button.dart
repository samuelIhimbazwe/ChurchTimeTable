import 'package:flutter/material.dart';
import '../../tokens/typography.dart';

enum CmmsButtonVariant { primary, secondary, outline, danger }

/// Localization-safe button — multiline labels, no fixed width.
class CmmsButton extends StatelessWidget {
  const CmmsButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.variant = CmmsButtonVariant.primary,
    this.expanded = true,
    this.isLoading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final CmmsButtonVariant variant;
  final bool expanded;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context).languageCode;
    final labelWidget = Text(
      label,
      textAlign: TextAlign.center,
      softWrap: true,
      style: TextStyle(
        height: CmmsTypography.adaptiveLineHeight(locale),
        fontWeight: FontWeight.w600,
      ),
    );

    Widget child = isLoading
        ? const SizedBox(
            height: 22,
            width: 22,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        : icon != null
            ? Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 20),
                  const SizedBox(width: 8),
                  Flexible(child: labelWidget),
                ],
              )
            : labelWidget;

    final button = switch (variant) {
      CmmsButtonVariant.primary => FilledButton(
          onPressed: isLoading ? null : onPressed,
          child: child,
        ),
      CmmsButtonVariant.secondary => FilledButton.tonal(
          onPressed: isLoading ? null : onPressed,
          child: child,
        ),
      CmmsButtonVariant.outline => OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          child: child,
        ),
      CmmsButtonVariant.danger => FilledButton(
          onPressed: isLoading ? null : onPressed,
          style: FilledButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
          child: child,
        ),
    };

    if (expanded) {
      return SizedBox(width: double.infinity, child: button);
    }
    return button;
  }
}
