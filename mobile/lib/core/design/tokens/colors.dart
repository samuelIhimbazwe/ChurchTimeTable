import 'package:flutter/material.dart';

/// Centralized CMMS color palette — church operating system tone.
abstract final class CmmsColors {
  // Brand
  static const Color primary = Color(0xFF1E3A8A);
  static const Color primaryLight = Color(0xFF3B5CB8);
  static const Color primaryDark = Color(0xFF152A66);
  static const Color accentGold = Color(0xFFD4A017);

  // Semantic
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFDC2626);
  static const Color info = Color(0xFF0891B2);

  // Light surfaces
  static const Color backgroundLight = Color(0xFFF8FAFC);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceVariantLight = Color(0xFFF1F5F9);
  static const Color outlineLight = Color(0xFFE2E8F0);
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF475569);

  // Dark surfaces
  static const Color backgroundDark = Color(0xFF0F172A);
  static const Color surfaceDark = Color(0xFF1E293B);
  static const Color surfaceVariantDark = Color(0xFF334155);
  static const Color outlineDark = Color(0xFF475569);
  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFFCBD5E1);

  static Color onPrimary(bool isDark) =>
      isDark ? textPrimaryDark : Colors.white;

  static Color background(bool isDark) =>
      isDark ? backgroundDark : backgroundLight;

  static Color surface(bool isDark) => isDark ? surfaceDark : surfaceLight;

  static Color textPrimary(bool isDark) =>
      isDark ? textPrimaryDark : textPrimaryLight;

  static Color textSecondary(bool isDark) =>
      isDark ? textSecondaryDark : textSecondaryLight;
}
