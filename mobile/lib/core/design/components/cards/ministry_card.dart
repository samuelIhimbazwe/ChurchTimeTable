import 'package:flutter/material.dart';
import '../../tokens/ministry_accents.dart';
import '../../tokens/spacing.dart';
import 'cmms_card.dart';

/// Navigation / summary card for a ministry module.
class MinistryCard extends StatelessWidget {
  const MinistryCard({
    super.key,
    required this.ministry,
    required this.title,
    this.subtitle,
    this.onTap,
    this.trailing,
  });

  final CmmsMinistry ministry;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;

  factory MinistryCard.fromApi(
    BuildContext context, {
    required String? ministryScope,
    required String title,
    String? subtitle,
    VoidCallback? onTap,
  }) {
    return MinistryCard(
      ministry: MinistryAccents.fromApi(ministryScope),
      title: title,
      subtitle: subtitle,
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    final accent = MinistryAccents.colorFor(ministry);
    final icon = MinistryAccents.iconFor(ministry);

    return CmmsCard(
      title: title,
      subtitle: subtitle,
      onTap: onTap,
      trailing: trailing ?? Icon(Icons.chevron_right, color: accent),
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: accent.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: accent, size: 24),
      ),
    );
  }
}

/// Grid tile variant for leader dashboard.
class MinistryGridTile extends StatelessWidget {
  const MinistryGridTile({
    super.key,
    required this.ministry,
    required this.label,
    required this.onTap,
  });

  final CmmsMinistry ministry;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = MinistryAccents.colorFor(ministry);
    final icon = MinistryAccents.iconFor(ministry);

    return Material(
      color: Theme.of(context).cardTheme.color,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Theme.of(context).dividerColor),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(CmmsSpacing.sm),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 32, color: accent),
              const SizedBox(height: CmmsSpacing.xs),
              Text(
                label,
                textAlign: TextAlign.center,
                softWrap: true,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      height: 1.35,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
