import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LocaleStorageService {
  LocaleStorageService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  static const _key = 'preferred_locale';
  final FlutterSecureStorage _storage;

  Future<String?> read() => _storage.read(key: _key);

  Future<void> write(String languageCode) =>
      _storage.write(key: _key, value: languageCode);
}
