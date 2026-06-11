import 'package:flutter/material.dart';
import '../tokens/colors.dart';
import '../tokens/radius.dart';
import '../tokens/typography.dart';

ThemeData buildDarkTheme() {
  const brightness = Brightness.dark;
  final colorScheme = ColorScheme(
    brightness: brightness,
    primary: CmmsColors.primary400,
    onPrimary: CmmsColors.primary900,
    secondary: CmmsColors.gold400,
    onSecondary: CmmsColors.primary900,
    error: CmmsColors.danger,
    onError: Colors.white,
    surface: CmmsColors.surfaceDark,
    onSurface: CmmsColors.textPrimaryDark,
    onSurfaceVariant: CmmsColors.textSecondaryDark,
    surfaceContainerHighest: CmmsColors.surfaceVariantDark,
    outline: CmmsColors.outlineDark,
    outlineVariant: CmmsColors.outlineDark,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: CmmsColors.backgroundDark,
    fontFamily: CmmsTypography.bodyFamily,
    textTheme: CmmsTypography.textTheme(brightness),
    appBarTheme: AppBarTheme(
      centerTitle: false,
      elevation: 0,
      scrolledUnderElevation: 0,
      backgroundColor: CmmsColors.surfaceDark,
      foregroundColor: CmmsColors.textPrimaryDark,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: CmmsTypography.textTheme(brightness).titleLarge,
    ),
    drawerTheme: const DrawerThemeData(
      backgroundColor: CmmsColors.primary900,
      surfaceTintColor: Colors.transparent,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: CmmsColors.surfaceVariantDark,
      shape: RoundedRectangleBorder(
        borderRadius: CmmsRadius.card,
        side: const BorderSide(color: CmmsColors.outlineDark),
      ),
      margin: EdgeInsets.zero,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: CmmsColors.gold500,
        foregroundColor: CmmsColors.primary900,
        minimumSize: const Size(64, 48),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: CmmsRadius.button),
      ),
    ),
    navigationRailTheme: NavigationRailThemeData(
      backgroundColor: Colors.transparent,
      indicatorColor: CmmsColors.primary800,
      selectedIconTheme: const IconThemeData(color: CmmsColors.gold400),
      selectedLabelTextStyle: const TextStyle(
        color: CmmsColors.textInverse,
        fontWeight: FontWeight.w600,
      ),
      unselectedIconTheme: const IconThemeData(color: CmmsColors.primary300),
      unselectedLabelTextStyle: const TextStyle(color: CmmsColors.primary300),
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
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: CmmsColors.gold400,
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
        borderSide: const BorderSide(color: CmmsColors.gold400, width: 2),
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
      backgroundColor: CmmsColors.surfaceVariantDark,
      shape: RoundedRectangleBorder(borderRadius: CmmsRadius.dialog),
    ),
  );
}
