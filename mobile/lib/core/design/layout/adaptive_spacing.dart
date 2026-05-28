import 'package:flutter/material.dart';
import '../tokens/spacing.dart';
import 'responsive.dart';

/// Locale- and screen-aware spacing helpers.
class AdaptiveSpacing {
  const AdaptiveSpacing._();

  static EdgeInsets screen(BuildContext context) {
    final pad = CmmsResponsive.of(context).screenPadding;
    return EdgeInsets.all(pad);
  }

  static EdgeInsets card(BuildContext context) {
    final r = CmmsResponsive.of(context);
    return EdgeInsets.symmetric(
      horizontal: r.isCompact ? CmmsSpacing.sm : CmmsSpacing.cardPadding,
      vertical: CmmsSpacing.sm,
    );
  }

  static double sectionGap(BuildContext context, String localeCode) {
    final base = CmmsSpacing.sectionGap;
    if (localeCode == 'fr') return base + 4;
    return base;
  }
}
