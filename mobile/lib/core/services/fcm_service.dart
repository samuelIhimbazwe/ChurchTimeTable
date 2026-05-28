import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import '../api/api_client.dart';

class FcmService {
  FcmService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;
  final _messaging = FirebaseMessaging.instance;

  Future<void> initialize() async {
    if (kIsWeb) return;

    await _messaging.requestPermission();
    final token = await _messaging.getToken();
    if (token != null) {
      await _registerToken(token);
    }

    _messaging.onTokenRefresh.listen(_registerToken);
    FirebaseMessaging.onMessage.listen((message) {
      debugPrint('FCM foreground: ${message.notification?.title}');
    });
  }

  Future<void> _registerToken(String token) async {
    try {
      await _client.loadToken();
      await _client.dio.post('/users/fcm-token', data: {'token': token});
    } catch (e) {
      debugPrint('FCM register failed: $e');
    }
  }
}
