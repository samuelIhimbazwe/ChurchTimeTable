import 'package:flutter/material.dart';
import 'colors.dart';

abstract final class CmmsShadows {
  static List<BoxShadow> card(bool isDark) => [
        BoxShadow(
          color: isDark
              ? Colors.black.withValues(alpha: 0.35)
              : CmmsColors.primary.withValues(alpha: 0.06),
          blurRadius: isDark ? 8 : 12,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> elevated(bool isDark) => [
        BoxShadow(
          color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
      ];
}
