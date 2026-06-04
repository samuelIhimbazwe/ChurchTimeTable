import 'package:dio/dio.dart';

import '../api/api_response.dart';
import 'choir_offline_repository.dart';

/// Choir API + offline cache helpers for welfare, music, and rehearsals.
class ChoirRepository {
  ChoirRepository(this._dio);

  final Dio _dio;
  final ChoirOfflineRepository _offline = ChoirOfflineRepository();

  Future<Map<String, dynamic>> _unwrap(Response<dynamic> res) async {
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    if (!parsed.success || parsed.data == null) {
      throw Exception(parsed.error?.message ?? 'Request failed');
    }
    return parsed.data!;
  }

  List<Map<String, dynamic>> _items(Map<String, dynamic> data, String key) {
    return (data[key] as List? ?? const [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }

  // --- Welfare ---

  Future<Map<String, dynamic>> fetchWelfareDashboard({bool offlineFallback = true}) async {
    try {
      final data = await _unwrap(await _dio.get('/choir/welfare/dashboard'));
      await _offline.cacheJson('welfare_dashboard', data);
      return data;
    } catch (e) {
      if (!offlineFallback) rethrow;
      return await _offline.readJson('welfare_dashboard') ?? {};
    }
  }

  Future<List<Map<String, dynamic>>> fetchWelfareCases({bool offlineFallback = true}) async {
    try {
      final data = await _unwrap(
        await _dio.get('/choir/welfare/cases', queryParameters: {'limit': 50}),
      );
      final items = _items(data, 'items');
      await _offline.cacheList('welfare_cases', items);
      return items;
    } catch (e) {
      if (!offlineFallback) rethrow;
      return _offline.readList('welfare_cases');
    }
  }

  Future<List<Map<String, dynamic>>> fetchWelfareCategories() async {
    return _listFromEnvelope(await _dio.get('/choir/welfare/categories'));
  }

  List<Map<String, dynamic>> _listFromEnvelope(Response<dynamic> res) {
    final root = res.data as Map<String, dynamic>;
    final raw = root['data'];
    if (raw is List) {
      return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    if (raw is Map) {
      return _items(Map<String, dynamic>.from(raw), 'items');
    }
    return const [];
  }

  Future<Map<String, dynamic>> fetchWelfareCase(
    String caseId, {
    bool offlineFallback = true,
  }) async {
    final key = 'welfare_case_$caseId';
    try {
      final data = await _unwrap(await _dio.get('/choir/welfare/cases/$caseId'));
      await _offline.cacheJson(key, data);
      return data;
    } catch (e) {
      if (!offlineFallback) rethrow;
      return await _offline.readJson(key) ?? {};
    }
  }

  Future<List<Map<String, dynamic>>> fetchWelfareTimeline(String caseId) async {
    return _listFromEnvelope(await _dio.get('/choir/welfare/cases/$caseId/timeline'));
  }

  Future<Map<String, dynamic>> createWelfareCase(Map<String, dynamic> body) async {
    return _unwrap(await _dio.post('/choir/welfare/cases', data: body));
  }

  Future<Map<String, dynamic>> updateWelfareCase(
    String caseId,
    Map<String, dynamic> body,
  ) async {
    return _unwrap(await _dio.patch('/choir/welfare/cases/$caseId', data: body));
  }

  Future<void> submitWelfareContribution({
    required String caseId,
    required double amount,
  }) async {
    await _dio.post(
      '/choir/welfare/my-contributions',
      data: {'caseId': caseId, 'amount': amount},
    );
  }

  Future<void> recordWelfareAssistance(Map<String, dynamic> body) async {
    await _dio.post('/choir/welfare/assistance', data: body);
  }

  Future<Map<String, dynamic>> fetchWelfareReports() async {
    return _unwrap(await _dio.get('/choir/welfare/reports'));
  }

  // --- Music ---

  Future<List<Map<String, dynamic>>> fetchSongs({bool offlineFallback = true}) async {
    try {
      final data = await _unwrap(
        await _dio.get('/choir/music/songs', queryParameters: {'limit': 100}),
      );
      final items = _items(data, 'items');
      await _offline.cacheList('music_songs', items);
      return items;
    } catch (e) {
      if (!offlineFallback) rethrow;
      return _offline.readList('music_songs');
    }
  }

  Future<List<Map<String, dynamic>>> fetchMusicFavorites({bool offlineFallback = true}) async {
    try {
      final items = _listFromEnvelope(await _dio.get('/choir/music/favorites'));
      await _offline.cacheList('music_favorites', items);
      return items;
    } catch (e) {
      if (!offlineFallback) rethrow;
      return _offline.readList('music_favorites');
    }
  }

  Future<Map<String, dynamic>> fetchSong(
    String songId, {
    bool offlineFallback = true,
  }) async {
    final key = 'music_song_$songId';
    try {
      final data = await _unwrap(await _dio.get('/choir/music/songs/$songId'));
      await _offline.cacheJson(key, data);
      return data;
    } catch (e) {
      if (!offlineFallback) rethrow;
      return await _offline.readJson(key) ?? {};
    }
  }

  Future<void> toggleSongFavorite(String songId) async {
    await _dio.post('/choir/music/songs/$songId/favorite');
  }

  Future<void> trackRecentSong(String songId) async {
    final recent = await _offline.readList('music_recent');
    final filtered = recent.where((s) => s['id'] != songId).toList();
    filtered.insert(0, {'id': songId, 'viewedAt': DateTime.now().toIso8601String()});
    await _offline.cacheList(
      'music_recent',
      filtered.take(20).toList(),
    );
  }

  Future<List<Map<String, dynamic>>> readRecentSongs() async {
    return _offline.readList('music_recent');
  }

  // --- Rehearsals ---

  Future<Map<String, dynamic>> fetchRehearsalDashboard({bool offlineFallback = true}) async {
    try {
      final data = await _unwrap(await _dio.get('/choir/rehearsals/dashboard'));
      await _offline.cacheJson('rehearsals_dashboard', data);
      return data;
    } catch (e) {
      if (!offlineFallback) rethrow;
      return await _offline.readJson('rehearsals_dashboard') ?? {};
    }
  }

  Future<Map<String, dynamic>> fetchRehearsalPlan(
    String eventId, {
    bool offlineFallback = true,
  }) async {
    final key = 'rehearsal_plan_$eventId';
    try {
      final data = await _unwrap(await _dio.get('/choir/rehearsals/plans/$eventId'));
      await _offline.cacheJson(key, data);
      return data;
    } catch (e) {
      if (!offlineFallback) rethrow;
      return await _offline.readJson(key) ?? {};
    }
  }

  Future<List<Map<String, dynamic>>> fetchRehearsalAttendance(String eventId) async {
    return _listFromEnvelope(
      await _dio.get('/choir/rehearsals/plans/$eventId/attendance'),
    );
  }

  Future<void> recordRehearsalAttendance(
    String eventId,
    List<Map<String, dynamic>> entries,
  ) async {
    await _dio.post(
      '/choir/rehearsals/plans/$eventId/attendance',
      data: {'entries': entries},
    );
  }

  Future<List<Map<String, dynamic>>> fetchSectionReadiness() async {
    return _listFromEnvelope(await _dio.get('/choir/rehearsals/readiness'));
  }

  Future<Map<String, dynamic>> fetchRehearsalReports() async {
    return _unwrap(await _dio.get('/choir/rehearsals/reports'));
  }

  // --- Devotions ---

  Future<Map<String, dynamic>> fetchDevotionWidget({bool offlineFallback = true}) async {
    try {
      final data = await _unwrap(await _dio.get('/choir/devotions/widget'));
      await _offline.cacheJson('devotion_widget', data);
      return data;
    } catch (e) {
      if (!offlineFallback) rethrow;
      return await _offline.readJson('devotion_widget') ?? {};
    }
  }

  Future<List<Map<String, dynamic>>> fetchDevotions() async {
    return _listFromEnvelope(await _dio.get('/choir/devotions'));
  }

  Future<List<Map<String, dynamic>>> fetchUserChoirs() async {
    return _listFromEnvelope(await _dio.get('/choirs'));
  }
}
