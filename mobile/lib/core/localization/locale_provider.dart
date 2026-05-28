import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import 'locale_storage_service.dart';

const defaultLocale = Locale('rw');

final localeStorageProvider = Provider((ref) => LocaleStorageService());

final apiClientProvider = Provider((ref) => ApiClient());

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier(this._storage, this._api) : super(defaultLocale) {
    _bootstrap();
  }

  final LocaleStorageService _storage;
  final ApiClient _api;

  Future<void> _bootstrap() async {
    final saved = await _storage.read();
    if (saved != null && _isSupported(saved)) {
      state = Locale(saved);
    } else {
      state = defaultLocale;
      await _storage.write('rw');
    }
    await _api.setLanguage(state.languageCode);
  }

  bool _isSupported(String code) => ['rw', 'en', 'fr'].contains(code);

  Future<void> setLocale(
    Locale locale, {
    String? userId,
    bool syncBackend = true,
  }) async {
    if (!_isSupported(locale.languageCode)) return;
    state = locale;
    await _storage.write(locale.languageCode);
    await _api.setLanguage(locale.languageCode);

    if (syncBackend && userId != null) {
      try {
        await _api.loadToken();
        await _api.dio.post(
          '/users/language',
          data: {'preferredLanguage': locale.languageCode},
        );
      } catch (_) {}
    }
  }

  Future<void> syncFromProfile(String? preferredLanguage) async {
    if (preferredLanguage != null && _isSupported(preferredLanguage)) {
      state = Locale(preferredLanguage);
      await _storage.write(preferredLanguage);
      await _api.setLanguage(preferredLanguage);
    }
  }
}

final localeProvider =
    StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier(
    ref.watch(localeStorageProvider),
    ref.watch(apiClientProvider),
  );
});
