import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../tokens/colors.dart';
import '../tokens/radius.dart';
import '../tokens/typography.dart';

ThemeData buildLightTheme() {
  const brightness = Brightness.light;
  final colorScheme = ColorScheme(
    brightness: brightness,
    primary: CmmsColors.primary,
    onPrimary: Colors.white,
    secondary: CmmsColors.accentGold,
    onSecondary: CmmsColors.textPrimaryLight,
    error: CmmsColors.danger,
    onError: Colors.white,
    surface: CmmsColors.surfaceLight,
    onSurface: CmmsColors.textPrimaryLight,
    surfaceContainerHighest: CmmsColors.surfaceVariantLight,
    outline: CmmsColors.outlineLight,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: CmmsColors.backgroundLight,
    fontFamily: CmmsTypography.fontFamily,
    textTheme: CmmsTypography.textTheme(brightness),
    appBarTheme: AppBarTheme(
      centerTitle: true,
      elevation: 0,
      scrolledUnderElevation: 0,
      backgroundColor: CmmsColors.surfaceLight,
      foregroundColor: CmmsColors.textPrimaryLight,
      titleTextStyle: CmmsTypography.textTheme(brightness).titleLarge,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: CmmsColors.surfaceLight,
      shape: RoundedRectangleBorder(
        borderRadius: CmmsRadius.card,
        side: const BorderSide(color: CmmsColors.outlineLight),
      ),
      margin: EdgeInsets.zero,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: CmmsColors.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size(64, 48),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: CmmsRadius.button),
        textStyle: CmmsTypography.textTheme(brightness).labelLarge,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: CmmsColors.primary,
        minimumSize: const Size(64, 48),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: CmmsRadius.button),
        side: const BorderSide(color: CmmsColors.outlineLight),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: CmmsColors.surfaceVariantLight,
      border: OutlineInputBorder(borderRadius: CmmsRadius.button),
      enabledBorder: OutlineInputBorder(
        borderRadius: CmmsRadius.button,
        borderSide: const BorderSide(color: CmmsColors.outlineLight),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: CmmsRadius.button,
        borderSide: const BorderSide(color: CmmsColors.primary, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: CmmsRadius.chip),
      side: BorderSide.none,
      labelStyle: CmmsTypography.textTheme(brightness).labelMedium,
    ),
    dividerTheme: const DividerThemeData(color: CmmsColors.outlineLight),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: CmmsRadius.button),
    ),
    dialogTheme: DialogThemeData(
      shape: RoundedRectangleBorder(borderRadius: CmmsRadius.dialog),
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      },
    ),
  );
}
