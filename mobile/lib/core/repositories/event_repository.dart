import 'dart:convert';

import 'package:hive/hive.dart';

import '../api/api_client.dart';
import '../api/api_response.dart';

class EventRepository {
  EventRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;
  static const _cacheKeyList = 'events_list';
  static String _cacheKeyDetail(String id) => 'event_$id';

  Box get _cache => Hive.box('cache');

  Future<List<Map<String, dynamic>>> list({
    int limit = 100,
    String? type,
    String? ministryScope,
    String? from,
    String? to,
    bool preferCache = false,
  }) async {
    if (preferCache && _cache.containsKey(_cacheKeyList)) {
      return _decodeList(_cache.get(_cacheKeyList));
    }
    try {
      await _client.loadToken();
      final res = await _client.dio.get(
        '/events',
        queryParameters: {
          'limit': limit,
          if (type != null) 'type': type,
          if (ministryScope != null) 'ministryScope': ministryScope,
          if (from != null) 'from': from,
          if (to != null) 'to': to,
        },
      );
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      final items = ((parsed.data?['items'] as List?) ?? [])
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      await _cache.put(_cacheKeyList, jsonEncode(items));
      return items;
    } catch (_) {
      if (_cache.containsKey(_cacheKeyList)) {
        return _decodeList(_cache.get(_cacheKeyList));
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> findOne(String id, {bool preferCache = false}) async {
    final key = _cacheKeyDetail(id);
    if (preferCache && _cache.containsKey(key)) {
      return Map<String, dynamic>.from(
        jsonDecode(_cache.get(key) as String) as Map,
      );
    }
    try {
      await _client.loadToken();
      final res = await _client.dio.get('/events/$id');
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      final event = parsed.data ?? {};
      await _cache.put(key, jsonEncode(event));
      return event;
    } catch (_) {
      if (_cache.containsKey(key)) {
        return Map<String, dynamic>.from(
          jsonDecode(_cache.get(key) as String) as Map,
        );
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> payload) async {
    await _client.loadToken();
    final res = await _client.dio.post('/events', data: payload);
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    final event = parsed.data ?? {};
    await _invalidateList();
    return event;
  }

  Future<Map<String, dynamic>> update(String id, Map<String, dynamic> payload) async {
    await _client.loadToken();
    final res = await _client.dio.patch('/events/$id', data: payload);
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    final event = parsed.data ?? {};
    await _cache.put(_cacheKeyDetail(id), jsonEncode(event));
    await _invalidateList();
    return event;
  }

  Future<List<Map<String, dynamic>>> auditForEvent(String eventId) async {
    await _client.loadToken();
    final res = await _client.dio.get(
      '/audit',
      queryParameters: {'entity': 'Event', 'entityId': eventId, 'limit': 30},
    );
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return ((parsed.data?['items'] as List?) ?? [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }

  Future<void> _invalidateList() async {
    await _cache.delete(_cacheKeyList);
  }

  List<Map<String, dynamic>> _decodeList(dynamic raw) {
    final list = jsonDecode(raw as String) as List;
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }
}
