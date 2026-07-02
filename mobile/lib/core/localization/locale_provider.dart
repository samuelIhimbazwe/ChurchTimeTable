import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import 'locale_storage_service.dart';

const defaultLocale = Locale('en');

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
    if (saved != null) {
      state = _normalize(Locale(saved));
      await _storage.write(state.languageCode);
    } else {
      state = defaultLocale;
      await _storage.write('en');
    }
    await _api.setLanguage(state.languageCode);
  }

  Locale _normalize(Locale locale) {
    if (locale.languageCode == 'fr') return const Locale('fr');
    return const Locale('en');
  }

  bool _isSupported(String code) => code == 'en' || code == 'fr';

  Future<void> setLocale(
    Locale locale, {
    String? userId,
    bool syncBackend = true,
  }) async {
    final normalized = _normalize(locale);
    if (!_isSupported(normalized.languageCode)) return;
    state = normalized;
    await _storage.write(normalized.languageCode);
    await _api.setLanguage(normalized.languageCode);

    if (syncBackend && userId != null) {
      try {
        await _api.loadToken();
        await _api.dio.post(
          '/users/language',
          data: {'preferredLanguage': normalized.languageCode},
        );
      } catch (_) {}
    }
  }

  Future<void> syncFromProfile(String? preferredLanguage) async {
    if (preferredLanguage == null) return;
    final normalized = preferredLanguage == 'fr' ? 'fr' : 'en';
    state = Locale(normalized);
    await _storage.write(normalized);
    await _api.setLanguage(normalized);
  }
}

final localeProvider =
    StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier(
    ref.watch(localeStorageProvider),
    ref.watch(apiClientProvider),
  );
});
