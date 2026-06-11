import 'package:flutter/material.dart';

import '../../tokens/colors.dart';
import '../../tokens/spacing.dart';

/// Web-aligned KPI tile (matches StatTile.tsx).
class CmmsStatTile extends StatelessWidget {
  const CmmsStatTile({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.prefix = '',
    this.suffix = '',
    this.accent = false,
    this.onTap,
  });

  final String label;
  final String value;
  final IconData? icon;
  final String prefix;
  final String suffix;
  final bool accent;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textTheme = Theme.of(context).textTheme;

    return Material(
      color: CmmsColors.surface(isDark),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isDark ? CmmsColors.outlineDark : CmmsColors.outlineLight,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: accent
                ? const Border(
                    left: BorderSide(color: CmmsColors.gold500, width: 4),
                  )
                : null,
          ),
          padding: const EdgeInsets.all(Spacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      label,
                      style: textTheme.bodySmall?.copyWith(
                        color: CmmsColors.textSecondary(isDark),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  if (icon != null)
                    Icon(
                      icon,
                      size: 18,
                      color: CmmsColors.gold500,
                    ),
                ],
              ),
              const SizedBox(height: Spacing.sm),
              Text(
                '$prefix$value$suffix',
                style: textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: CmmsColors.textPrimary(isDark),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
