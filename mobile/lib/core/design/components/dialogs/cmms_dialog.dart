import 'package:flutter/material.dart';
import '../../layout/localized_text.dart';
import '../buttons/cmms_button.dart';

/// Localization-safe alert dialog — multiline title and body.
class CmmsDialog {
  CmmsDialog._();

  static Future<bool?> confirm(
    BuildContext context, {
    required String title,
    required String message,
    required String confirmLabel,
    required String cancelLabel,
    CmmsButtonVariant confirmVariant = CmmsButtonVariant.primary,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: LocalizedText(title, style: Theme.of(ctx).textTheme.titleLarge),
        content: LocalizedText(
          message,
          style: Theme.of(ctx).textTheme.bodyMedium,
        ),
        actionsAlignment: MainAxisAlignment.stretch,
        actions: [
          CmmsButton(
            label: cancelLabel,
            variant: CmmsButtonVariant.outline,
            expanded: true,
            onPressed: () => Navigator.pop(ctx, false),
          ),
          const SizedBox(height: 8),
          CmmsButton(
            label: confirmLabel,
            variant: confirmVariant,
            expanded: true,
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );
  }
}
