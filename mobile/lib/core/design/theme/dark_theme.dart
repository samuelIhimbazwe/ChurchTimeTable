import 'package:flutter/material.dart';
import '../tokens/colors.dart';
import '../tokens/radius.dart';
import '../tokens/typography.dart';

ThemeData buildDarkTheme() {
  const brightness = Brightness.dark;
  final colorScheme = ColorScheme(
    brightness: brightness,
    primary: CmmsColors.primaryLight,
    onPrimary: CmmsColors.textPrimaryDark,
    secondary: CmmsColors.accentGold,
    onSecondary: CmmsColors.textPrimaryDark,
    error: CmmsColors.danger,
    onError: Colors.white,
    surface: CmmsColors.surfaceDark,
    onSurface: CmmsColors.textPrimaryDark,
    surfaceContainerHighest: CmmsColors.surfaceVariantDark,
    outline: CmmsColors.outlineDark,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: CmmsColors.backgroundDark,
    fontFamily: CmmsTypography.fontFamily,
    textTheme: CmmsTypography.textTheme(brightness),
    appBarTheme: AppBarTheme(
      centerTitle: true,
      elevation: 0,
      scrolledUnderElevation: 0,
      backgroundColor: CmmsColors.surfaceDark,
      foregroundColor: CmmsColors.textPrimaryDark,
      titleTextStyle: CmmsTypography.textTheme(brightness).titleLarge,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: CmmsColors.surfaceDark,
      shape: RoundedRectangleBorder(
        borderRadius: CmmsRadius.card,
        side: const BorderSide(color: CmmsColors.outlineDark),
      ),
      margin: EdgeInsets.zero,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: CmmsColors.primaryLight,
        foregroundColor: CmmsColors.textPrimaryDark,
        minimumSize: const Size(64, 48),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: CmmsRadius.button),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: CmmsColors.textPrimaryDark,
        minimumSize: const Size(64, 48),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: CmmsRadius.button),
        side: const BorderSide(color: CmmsColors.outlineDark),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: CmmsColors.surfaceVariantDark,
      border: OutlineInputBorder(borderRadius: CmmsRadius.button),
      enabledBorder: OutlineInputBorder(
        borderRadius: CmmsRadius.button,
        borderSide: const BorderSide(color: CmmsColors.outlineDark),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: CmmsRadius.button,
        borderSide: const BorderSide(color: CmmsColors.primaryLight, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: CmmsRadius.chip),
      side: BorderSide.none,
    ),
    dividerTheme: const DividerThemeData(color: CmmsColors.outlineDark),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: CmmsColors.surfaceVariantDark,
      shape: RoundedRectangleBorder(borderRadius: CmmsRadius.button),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: CmmsColors.surfaceDark,
      shape: RoundedRectangleBorder(borderRadius: CmmsRadius.dialog),
    ),
  );
}
