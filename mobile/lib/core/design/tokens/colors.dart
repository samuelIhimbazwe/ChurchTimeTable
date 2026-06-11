import 'package:flutter/material.dart';

/// CMMS palette — aligned with web `globals.css` (Deep Sacred Navy + Gold).
abstract final class CmmsColors {
  // Primary navy scale (web)
  static const Color primary950 = Color(0xFF0A0F1E);
  static const Color primary900 = Color(0xFF0F172A);
  static const Color primary800 = Color(0xFF1E2D4A);
  static const Color primary700 = Color(0xFF2D4163);
  static const Color primary600 = Color(0xFF3B567D);
  static const Color primary500 = Color(0xFF4A6B96);
  static const Color primary400 = Color(0xFF6B8BB5);
  static const Color primary300 = Color(0xFF93AFCF);
  static const Color primary200 = Color(0xFFBDD0E6);
  static const Color primary100 = Color(0xFFE1EAF4);
  static const Color primary50 = Color(0xFFF0F5FA);

  /// Main brand primary (sidebar, structural).
  static const Color primary = primary700;

  // Gold accent (web trial #B8860B)
  static const Color gold900 = Color(0xFF5C4500);
  static const Color gold800 = Color(0xFF7A5A00);
  static const Color gold700 = Color(0xFF966D09);
  static const Color gold600 = Color(0xFFA6780A);
  static const Color gold500 = Color(0xFFB8860B);
  static const Color gold400 = Color(0xFFC99A1A);
  static const Color gold300 = Color(0xFFD4B060);
  static const Color gold100 = Color(0xFFF5ECD4);
  static const Color gold50 = Color(0xFFFBF7ED);

  static const Color accentGold = gold500;

  // Semantic (web)
  static const Color success = Color(0xFF2D7A4F);
  static const Color successLight = Color(0xFFE8F5EE);
  static const Color warning = Color(0xFFC17A10);
  static const Color warningLight = Color(0xFFFEF3DC);
  static const Color danger = Color(0xFFB83232);
  static const Color dangerLight = Color(0xFFFDEAEA);
  static const Color info = Color(0xFF1E5FA0);
  static const Color infoLight = Color(0xFFE6EFF9);

  // Light surfaces (web)
  static const Color backgroundLight = Color(0xFFF8F9FC);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceVariantLight = Color(0xFFF1F4F9);
  static const Color outlineLight = Color(0xFFE2E8F0);
  static const Color outlineStrongLight = Color(0xFFCBD5E1);
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF475569);
  static const Color textMutedLight = Color(0xFF94A3B8);
  static const Color textInverse = Color(0xFFF8FAFC);

  // Dark surfaces (web)
  static const Color backgroundDark = Color(0xFF0F172A);
  static const Color surfaceDark = Color(0xFF0F172A);
  static const Color surfaceVariantDark = Color(0xFF1E293B);
  static const Color surfaceOverlayDark = Color(0xFF263448);
  static const Color outlineDark = Color(0xFF2D3F55);
  static const Color textPrimaryDark = Color(0xFFF1F5F9);
  static const Color textSecondaryDark = Color(0xFF94A3B8);
  static const Color textMutedDark = Color(0xFF64748B);

  // Dark-mode link/icon tones (web globals.css)
  static const Color primaryDarkMode = primary400;
  static const Color goldDarkMode = gold400;

  static Color onPrimary(bool isDark) =>
      isDark ? primary900 : primary900;

  static Color onGold(bool isDark) => primary900;

  static Color background(bool isDark) =>
      isDark ? backgroundDark : backgroundLight;

  static Color surface(bool isDark) => isDark ? surfaceDark : surfaceLight;

  static Color surfaceRaised(bool isDark) =>
      isDark ? surfaceVariantDark : backgroundLight;

  static Color textPrimary(bool isDark) =>
      isDark ? textPrimaryDark : textPrimaryLight;

  static Color textSecondary(bool isDark) =>
      isDark ? textSecondaryDark : textSecondaryLight;

  static Color textMuted(bool isDark) =>
      isDark ? textMutedDark : textMutedLight;

  static Color link(bool isDark) =>
      isDark ? primary400 : primary600;

  static Color linkHover(bool isDark) =>
      isDark ? gold400 : primary800;
}
