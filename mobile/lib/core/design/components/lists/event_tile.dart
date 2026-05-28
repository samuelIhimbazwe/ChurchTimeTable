import 'package:flutter/material.dart';
import '../../layout/localized_text.dart';
import '../../tokens/ministry_accents.dart';
import '../../tokens/spacing.dart';
import '../chips/cmms_chip.dart';

/// Event list item — title, time, ministry, optional status chip.
class EventTile extends StatelessWidget {
  const EventTile({
    super.key,
    required this.title,
    required this.subtitle,
    this.ministry,
    this.statusLabel,
    this.statusColor,
    this.onTap,
    this.trailing,
  });

  final String title;
  final String subtitle;
  final CmmsMinistry? ministry;
  final String? statusLabel;
  final Color? statusColor;
  final VoidCallback? onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final accent = ministry != null
        ? MinistryAccents.colorFor(ministry!)
        : Theme.of(context).colorScheme.primary;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: CmmsSpacing.md,
        vertical: CmmsSpacing.xxs,
      ),
      leading: CircleAvatar(
        backgroundColor: accent.withValues(alpha: 0.12),
        child: Icon(
          ministry != null
              ? MinistryAccents.iconFor(ministry!)
              : Icons.event,
          color: accent,
          size: 22,
        ),
      ),
      title: LocalizedText(title, style: Theme.of(context).textTheme.titleSmall),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          LocalizedText(
            subtitle,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          if (statusLabel != null) ...[
            const SizedBox(height: 8),
            CmmsChip(
              label: statusLabel!,
              color: statusColor ?? accent,
            ),
          ],
        ],
      ),
      trailing: trailing,
      onTap: onTap,
      isThreeLine: statusLabel != null,
    );
  }
}
