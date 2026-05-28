import 'package:flutter/material.dart';
import '../../layout/localized_text.dart';
import '../../tokens/spacing.dart';

/// Overflow-safe list tile for multilingual subtitles.
class CmmsListTile extends StatelessWidget {
  const CmmsListTile({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
  });

  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: CmmsSpacing.md,
        vertical: CmmsSpacing.xxs,
      ),
      leading: leading,
      title: LocalizedText(title, style: Theme.of(context).textTheme.titleSmall),
      subtitle: subtitle != null
          ? LocalizedText(
              subtitle!,
              style: Theme.of(context).textTheme.bodySmall,
            )
          : null,
      trailing: trailing,
      onTap: onTap,
      isThreeLine: subtitle != null && subtitle!.length > 48,
    );
  }
}
