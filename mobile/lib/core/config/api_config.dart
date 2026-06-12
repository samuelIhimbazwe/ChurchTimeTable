import 'package:flutter/foundation.dart';

/// API base URL for pilot deployments.
///
/// Local override:
///   flutter run --dart-define=CMMS_API_BASE=http://192.168.1.10:3000/api/v1
///
/// Production pilot APK (Render — does not affect Vercel web):
///   .\scripts\build-pilot-apk.ps1
///   or: flutter build apk --release --dart-define=CMMS_API_BASE=https://cmms-api-ywcy.onrender.com/api/v1
///
/// Defaults (unchanged for local dev):
///   - Web/Desktop/iOS simulator: localhost
///   - Android emulator: 10.0.2.2
class ApiConfig {
  static const String androidEmulator = 'http://10.0.2.2:3000/api/v1';
  static const String localhost = 'http://127.0.0.1:3000/api/v1';

  /// Cloud pilot API — baked into APK via build-pilot-apk.ps1 only.
  static const String productionPilot =
      'https://cmms-api-ywcy.onrender.com/api/v1';

  static const String baseUrl = String.fromEnvironment(
    'CMMS_API_BASE',
    defaultValue: kIsWeb ? localhost : androidEmulator,
  );
}
