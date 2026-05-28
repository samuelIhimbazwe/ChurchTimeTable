import 'package:flutter/foundation.dart';

/// API base URL for pilot deployments.
///
/// Override at build/run time:
///   flutter run --dart-define=CMMS_API_BASE=http://192.168.1.10:3000/api/v1
///
/// Defaults:
///   - Web/Desktop/iOS simulator: localhost on the current machine
///   - Android emulator: 10.0.2.2 (host machine)
class ApiConfig {
  static const String androidEmulator = 'http://10.0.2.2:3000/api/v1';
  static const String localhost = 'http://127.0.0.1:3000/api/v1';

  static const String baseUrl = String.fromEnvironment(
    'CMMS_API_BASE',
    defaultValue: kIsWeb ? localhost : androidEmulator,
  );
}
