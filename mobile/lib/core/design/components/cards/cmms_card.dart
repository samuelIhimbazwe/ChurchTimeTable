import 'package:flutter/material.dart';
import '../../layout/localized_text.dart';
import '../../tokens/shadows.dart';
import '../../tokens/spacing.dart';

/// Multilingual-safe card — dynamic height, no fixed text containers.
class CmmsCard extends StatelessWidget {
  const CmmsCard({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
    this.child,
    this.padding,
  });

  final String? title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Widget? child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final content = Padding(
      padding: padding ??
          const EdgeInsets.symmetric(
            horizontal: CmmsSpacing.md,
            vertical: CmmsSpacing.sm,
          ),
      child: child ??
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (leading != null) ...[leading!, const SizedBox(width: 12)],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (title != null)
                      LocalizedText(
                        title!,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    if (subtitle != null) ...[
                      const SizedBox(height: CmmsSpacing.xxs),
                      LocalizedText(
                        subtitle!,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ],
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: CmmsSpacing.xs),
                trailing!,
              ],
            ],
          ),
    );

    return Material(
      color: Theme.of(context).cardTheme.color,
      elevation: 0,
      shadowColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: Theme.of(context).cardTheme.shape is RoundedRectangleBorder
            ? (Theme.of(context).cardTheme.shape as RoundedRectangleBorder)
                .borderRadius
            : BorderRadius.circular(12),
        side: BorderSide(
          color: Theme.of(context).dividerColor,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: DecoratedBox(
          decoration: BoxDecoration(
            boxShadow: CmmsShadows.card(isDark),
            borderRadius: BorderRadius.circular(12),
          ),
          child: content,
        ),
      ),
    );
  }
}
