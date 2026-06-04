import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';

/// Offline read cache for choir MVP modules (welfare, music, rehearsals).
class ChoirOfflineRepository {
  static const _boxName = 'choir_offline_v1';

  Future<Box<String>> _box() async {
    if (!Hive.isBoxOpen(_boxName)) {
      await Hive.openBox<String>(_boxName);
    }
    return Hive.box<String>(_boxName);
  }

  Future<void> cacheJson(String key, Map<String, dynamic> payload) async {
    final box = await _box();
    await box.put(key, jsonEncode(payload));
  }

  Future<Map<String, dynamic>?> readJson(String key) async {
    final box = await _box();
    final raw = box.get(key);
    if (raw == null) return null;
    return Map<String, dynamic>.from(jsonDecode(raw) as Map);
  }

  Future<void> cacheList(String key, List<Map<String, dynamic>> items) async {
    await cacheJson(key, {'items': items});
  }

  Future<List<Map<String, dynamic>>> readList(String key) async {
    final data = await readJson(key);
    if (data == null) return const [];
    return (data['items'] as List? ?? const [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }
}
