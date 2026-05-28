import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'colors.dart';

/// Multilingual-safe typography (Kinyarwanda, French accents, English).
abstract final class CmmsTypography {
  static const String fontFamily = 'Inter';

  static TextTheme textTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final base = GoogleFonts.notoSansTextTheme();
    final primary = CmmsColors.textPrimary(isDark);
    final secondary = CmmsColors.textSecondary(isDark);

    return base.copyWith(
      displayLarge: base.displayLarge?.copyWith(
        fontFamily: fontFamily,
        fontWeight: FontWeight.w700,
        color: primary,
        height: 1.2,
        letterSpacing: -0.5,
      ),
      headlineMedium: base.headlineMedium?.copyWith(
        fontFamily: fontFamily,
        fontWeight: FontWeight.w600,
        color: primary,
        height: 1.25,
      ),
      titleLarge: base.titleLarge?.copyWith(
        fontFamily: fontFamily,
        fontWeight: FontWeight.w600,
        color: primary,
        height: 1.3,
      ),
      titleMedium: base.titleMedium?.copyWith(
        fontFamily: fontFamily,
        fontWeight: FontWeight.w600,
        color: primary,
        height: 1.35,
      ),
      titleSmall: base.titleSmall?.copyWith(
        fontFamily: fontFamily,
        fontWeight: FontWeight.w500,
        color: primary,
        height: 1.35,
      ),
      bodyLarge: base.bodyLarge?.copyWith(
        fontFamily: fontFamily,
        fontWeight: FontWeight.w400,
        color: primary,
        height: 1.45,
      ),
      bodyMedium: base.bodyMedium?.copyWith(
        fontFamily: fontFamily,
        fontWeight: FontWeight.w400,
        color: primary,
        height: 1.5,
      ),
      bodySmall: base.bodySmall?.copyWith(
        fontFamily: fontFamily,
        fontWeight: FontWeight.w400,
        color: secondary,
        height: 1.45,
      ),
      labelLarge: base.labelLarge?.copyWith(
        fontFamily: fontFamily,
        fontWeight: FontWeight.w600,
        color: primary,
        height: 1.35,
      ),
      labelMedium: base.labelMedium?.copyWith(
        fontFamily: fontFamily,
        fontWeight: FontWeight.w500,
        color: secondary,
        height: 1.35,
      ),
    );
  }

  /// Line height multiplier for long French / Kinyarwanda labels in buttons.
  static double adaptiveLineHeight(String localeCode) {
    switch (localeCode) {
      case 'fr':
        return 1.4;
      case 'rw':
        return 1.45;
      default:
        return 1.35;
    }
  }
}
