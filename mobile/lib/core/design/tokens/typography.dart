import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'colors.dart';

/// Typography aligned with web: Cormorant Garamond (display) + DM Sans (body).
abstract final class CmmsTypography {
  static const String displayFamily = 'Cormorant Garamond';
  static const String bodyFamily = 'DM Sans';

  static TextStyle _display(TextStyle? base, {FontWeight? weight, Color? color, double? height}) {
    return GoogleFonts.cormorantGaramond(
      fontSize: base?.fontSize,
      fontWeight: weight ?? FontWeight.w600,
      color: color,
      height: height ?? 1.25,
      letterSpacing: base?.letterSpacing,
    );
  }

  static TextStyle _body(TextStyle? base, {FontWeight? weight, Color? color, double? height}) {
    return GoogleFonts.dmSans(
      fontSize: base?.fontSize,
      fontWeight: weight ?? FontWeight.w400,
      color: color,
      height: height ?? 1.5,
      letterSpacing: base?.letterSpacing,
    );
  }

  static TextTheme textTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final primary = CmmsColors.textPrimary(isDark);
    final secondary = CmmsColors.textSecondary(isDark);
    final muted = CmmsColors.textMuted(isDark);
    final base = GoogleFonts.dmSansTextTheme();

    return base.copyWith(
      displayLarge: _display(
        base.displayLarge,
        weight: FontWeight.w700,
        color: primary,
        height: 1.2,
      ),
      displayMedium: _display(base.displayMedium, color: primary),
      displaySmall: _display(base.displaySmall, color: primary),
      headlineLarge: _display(
        base.headlineLarge,
        weight: FontWeight.w600,
        color: primary,
      ),
      headlineMedium: _display(
        base.headlineMedium,
        weight: FontWeight.w600,
        color: primary,
      ),
      headlineSmall: _display(
        base.headlineSmall,
        weight: FontWeight.w600,
        color: primary,
      ),
      titleLarge: _body(
        base.titleLarge,
        weight: FontWeight.w600,
        color: primary,
        height: 1.3,
      ),
      titleMedium: _body(
        base.titleMedium,
        weight: FontWeight.w600,
        color: primary,
        height: 1.35,
      ),
      titleSmall: _body(
        base.titleSmall,
        weight: FontWeight.w500,
        color: primary,
        height: 1.35,
      ),
      bodyLarge: _body(base.bodyLarge, color: primary, height: 1.5),
      bodyMedium: _body(base.bodyMedium, color: primary, height: 1.5),
      bodySmall: _body(base.bodySmall, color: secondary, height: 1.45),
      labelLarge: _body(
        base.labelLarge,
        weight: FontWeight.w600,
        color: primary,
        height: 1.35,
      ),
      labelMedium: _body(
        base.labelMedium,
        weight: FontWeight.w500,
        color: secondary,
        height: 1.35,
      ),
      labelSmall: _body(
        base.labelSmall,
        weight: FontWeight.w500,
        color: muted,
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
