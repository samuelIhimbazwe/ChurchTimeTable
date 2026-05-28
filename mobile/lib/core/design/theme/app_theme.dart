import 'package:flutter/material.dart';
import 'light_theme.dart';
import 'dark_theme.dart';

/// Central theme entry — consume via [light] and [dark] in MaterialApp.
abstract final class AppTheme {
  static ThemeData get light => buildLightTheme();
  static ThemeData get dark => buildDarkTheme();
}
