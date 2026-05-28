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

  Future<void> loadToken() async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  Future<void> setLanguage(String languageCode) async {
    _dio.options.headers['Accept-Language'] = languageCode;
  }
}
