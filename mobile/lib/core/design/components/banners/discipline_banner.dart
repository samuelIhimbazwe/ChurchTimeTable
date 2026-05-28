import 'package:flutter/material.dart';
import '../../layout/localized_text.dart';
import '../../tokens/colors.dart';
import '../../tokens/radius.dart';
import '../../tokens/spacing.dart';

enum DisciplineBannerTone { warning, suspension, underReview, info }

/// Tone-aware discipline messaging — careful, pastoral-adjacent formal tone.
class DisciplineBanner extends StatelessWidget {
  const DisciplineBanner({
    super.key,
    required this.message,
    required this.tone,
    this.title,
    this.icon,
  });

  final String message;
  final DisciplineBannerTone tone;
  final String? title;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, defaultIcon) = _colors(tone);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(CmmsSpacing.md),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: CmmsRadius.card,
        border: Border.all(color: fg.withValues(alpha: 0.35)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon ?? defaultIcon, color: fg, size: 24),
          const SizedBox(width: CmmsSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (title != null) ...[
                  LocalizedText(
                    title!,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: fg,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: CmmsSpacing.xxs),
                ],
                LocalizedText(
                  message,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: fg,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  (Color bg, Color fg, IconData icon) _colors(DisciplineBannerTone tone) {
    switch (tone) {
      case DisciplineBannerTone.warning:
        return (
          CmmsColors.warning.withValues(alpha: 0.12),
          CmmsColors.warning,
          Icons.warning_amber_rounded,
        );
      case DisciplineBannerTone.suspension:
        return (
          CmmsColors.danger.withValues(alpha: 0.12),
          CmmsColors.danger,
          Icons.block,
        );
      case DisciplineBannerTone.underReview:
        return (
          CmmsColors.info.withValues(alpha: 0.12),
          CmmsColors.info,
          Icons.hourglass_top,
        );
      case DisciplineBannerTone.info:
        return (
          CmmsColors.primary.withValues(alpha: 0.08),
          CmmsColors.primary,
          Icons.info_outline,
        );
    }
  }
}
