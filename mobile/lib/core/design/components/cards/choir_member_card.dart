import 'package:flutter/material.dart';
import '../../layout/localized_text.dart';
import '../../tokens/colors.dart';
import '../../tokens/ministry_accents.dart';
import '../../tokens/spacing.dart';
import '../chips/cmms_chip.dart';

/// Choir member summary — attendance %, responsibility score, role.
class ChoirMemberCard extends StatelessWidget {
  const ChoirMemberCard({
    super.key,
    required this.name,
    this.role,
    this.attendancePercent,
    this.responsibilityScore,
    this.statusLabel,
    this.onTap,
  });

  final String name;
  final String? role;
  final double? attendancePercent;
  final double? responsibilityScore;
  final String? statusLabel;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final accent = MinistryAccents.colorFor(CmmsMinistry.choir);

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(CmmsSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: accent.withValues(alpha: 0.15),
                    child: Icon(Icons.person, color: accent),
                  ),
                  const SizedBox(width: CmmsSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        LocalizedText(
                          name,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        if (role != null)
                          LocalizedText(
                            role!,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                      ],
                    ),
                  ),
                  if (statusLabel != null)
                    CmmsChip(label: statusLabel!, color: accent),
                ],
              ),
              if (attendancePercent != null || responsibilityScore != null) ...[
                const SizedBox(height: CmmsSpacing.md),
                Row(
                  children: [
                    if (attendancePercent != null)
                      Expanded(
                        child: _Metric(
                          label: '%',
                          value: '${attendancePercent!.round()}',
                          color: CmmsColors.success,
                        ),
                      ),
                    if (responsibilityScore != null) ...[
                      const SizedBox(width: CmmsSpacing.sm),
                      Expanded(
                        child: _Metric(
                          label: 'Score',
                          value: responsibilityScore!.toStringAsFixed(1),
                          color: accent,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: CmmsSpacing.sm,
        vertical: CmmsSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                ),
          ),
          Text(label, style: Theme.of(context).textTheme.labelSmall),
        ],
      ),
    );
  }
}
