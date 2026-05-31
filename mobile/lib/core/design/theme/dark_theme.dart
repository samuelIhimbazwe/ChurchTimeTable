import 'package:flutter/material.dart';
import '../tokens/colors.dart';
import '../tokens/radius.dart';
import '../tokens/typography.dart';

ThemeData buildDarkTheme() {
  const brightness = Brightness.dark;
  final colorScheme = ColorScheme(
    brightness: brightness,
    primary: CmmsColors.primaryDarkMode,
    onPrimary: Colors.white,
    secondary: CmmsColors.accentGold,
    onSecondary: CmmsColors.textPrimaryDark,
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
        backgroundColor: CmmsColors.primaryDarkMode,
        foregroundColor: Colors.white,
        minimumSize: const Size(64, 48),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: CmmsRadius.button),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: CmmsColors.surfaceDark,
      indicatorColor: CmmsColors.primaryDarkMode.withValues(alpha: 0.2),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 12,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
          color: selected ? CmmsColors.primaryDarkMode : CmmsColors.textSecondaryDark,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(
          color: selected ? CmmsColors.primaryDarkMode : CmmsColors.textSecondaryDark,
        );
      }),
    ),
    navigationRailTheme: NavigationRailThemeData(
      backgroundColor: Colors.transparent,
      indicatorColor: CmmsColors.primaryDarkMode,
      selectedIconTheme: const IconThemeData(color: Colors.white),
      selectedLabelTextStyle: const TextStyle(
        color: Colors.white,
        fontWeight: FontWeight.w600,
      ),
      unselectedIconTheme: const IconThemeData(color: CmmsColors.textSecondaryDark),
      unselectedLabelTextStyle: const TextStyle(color: CmmsColors.textSecondaryDark),
    ),
    drawerTheme: const DrawerThemeData(
      backgroundColor: CmmsColors.surfaceDark,
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
        borderSide: const BorderSide(color: CmmsColors.primaryDarkMode, width: 2),
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
