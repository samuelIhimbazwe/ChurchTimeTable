import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

class ApiClient {
  ApiClient({String? baseUrl})
      : _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl ?? ApiConfig.baseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
            headers: {'Content-Type': 'application/json'},
          ),
        ),
        _storage = const FlutterSecureStorage();

  final Dio _dio;
  final FlutterSecureStorage _storage;
  Future<void>? _refreshFuture;

  Dio get dio => _dio;

  Future<void> setToken(String? token) async {
    if (token == null) {
      await _storage.delete(key: 'access_token');
      _dio.options.headers.remove('Authorization');
    } else {
      await _storage.write(key: 'access_token', value: token);
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  Future<void> setRefreshToken(String? token) async {
    if (token == null) {
      await _storage.delete(key: 'refresh_token');
    } else {
      await _storage.write(key: 'refresh_token', value: token);
    }
  }

  Future<void> loadToken() async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  Future<String?> getRefreshToken() => _storage.read(key: 'refresh_token');

  Future<void> setLanguage(String languageCode) async {
    _dio.options.headers['Accept-Language'] = languageCode;
  }

  Future<String?> refreshAccessToken() async {
    _refreshFuture ??= _performRefresh();
    try {
      return await _refreshFuture;
    } finally {
      _refreshFuture = null;
    }
  }

  Future<String?> _performRefresh() async {
    final refreshToken = await getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      return null;
    }

    try {
      final res = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final data = res.data;
      if (data is! Map<String, dynamic>) return null;
      final payload = data['data'];
      if (payload is! Map<String, dynamic>) return null;
      final accessToken = payload['accessToken'] as String?;
      final nextRefresh = payload['refreshToken'] as String?;
      if (accessToken == null) return null;
      await setToken(accessToken);
      if (nextRefresh != null) {
        await setRefreshToken(nextRefresh);
      }
      return accessToken;
    } catch (_) {
      return null;
    }
  }

  Future<void> logoutRemote() async {
    final refreshToken = await getRefreshToken();
    try {
      await _dio.post(
        '/auth/logout',
        data: refreshToken == null ? null : {'refreshToken': refreshToken},
      );
    } catch (_) {
      // Local logout still proceeds if the network call fails.
    } finally {
      await setToken(null);
      await setRefreshToken(null);
    }
  }
}
