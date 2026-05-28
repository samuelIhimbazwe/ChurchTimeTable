import 'package:flutter/material.dart';
import '../../layout/localized_text.dart';
import '../../tokens/radius.dart';

class CmmsChip extends StatelessWidget {
  const CmmsChip({
    super.key,
    required this.label,
    this.color,
    this.icon,
    this.backgroundOpacity = 0.12,
  });

  final String label;
  final Color? color;
  final IconData? icon;
  final double backgroundOpacity;

  @override
  Widget build(BuildContext context) {
    final accent = color ?? Theme.of(context).colorScheme.primary;
    final bg = accent.withValues(alpha: backgroundOpacity);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: CmmsRadius.chip,
        border: Border.all(color: accent.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: accent),
            const SizedBox(width: 6),
          ],
          Flexible(
            child: LocalizedText(
              label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: accent,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
