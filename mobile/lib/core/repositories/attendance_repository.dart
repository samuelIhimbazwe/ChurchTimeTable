import '../api/api_client.dart';
import '../api/api_response.dart';

class AttendanceRepository {
  AttendanceRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<List<Map<String, dynamic>>> byEvent(String eventId) async {
    await _client.loadToken();
    final res = await _client.dio.get(
      '/attendance/event/$eventId',
      queryParameters: {'page': 1, 'limit': 200},
    );
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return ((parsed.data?['items'] as List?) ?? [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }

  Future<Map<String, dynamic>> upsert(Map<String, dynamic> record) async {
    await _client.loadToken();
    final res = await _client.dio.put('/attendance', data: record);
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return parsed.data ?? {};
  }

  Future<Map<String, dynamic>> submitSelfExcused({
    required String eventId,
    required String reasonType,
    String? excuseReason,
    String? notes,
  }) async {
    await _client.loadToken();
    final res = await _client.dio.post(
      '/attendance/self/excused',
      data: {
        'eventId': eventId,
        'reasonType': reasonType,
        if (excuseReason != null) 'excuseReason': excuseReason,
        if (notes != null) 'notes': notes,
      },
    );
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return parsed.data ?? {};
  }

  Future<Map<String, dynamic>> bulkUpsert(
    List<Map<String, dynamic>> records,
  ) async {
    await _client.loadToken();
    final res = await _client.dio.post(
      '/attendance/bulk',
      data: {'records': records},
    );
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return parsed.data ?? {};
  }

  Future<Map<String, dynamic>> reviewExcused(
    String attendanceId, {
    required bool approve,
  }) async {
    await _client.loadToken();
    final res = await _client.dio.patch(
      '/attendance/$attendanceId/excused-review',
      data: {'approve': approve},
    );
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return parsed.data ?? {};
  }

  Future<Map<String, dynamic>> teamHeadSummary() async {
    await _client.loadToken();
    final res = await _client.dio.get('/attendance/operational/team-head');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return parsed.data ?? {};
  }

  Future<Map<String, dynamic>> memberScore(String memberId) async {
    await _client.loadToken();
    final res = await _client.dio.get('/attendance/member/$memberId/score');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return parsed.data ?? {};
  }

  Future<Map<String, dynamic>> choirSummary() async {
    await _client.loadToken();
    final res = await _client.dio.get('/attendance/operational/choir');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return parsed.data ?? {};
  }

  Future<List<Map<String, dynamic>>> disciplineRecommendations() async {
    await _client.loadToken();
    final res = await _client.dio.get('/attendance/discipline-recommendations');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return ((parsed.data?['items'] as List?) ?? [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }

  Future<void> createDisciplineCase({
    required String memberId,
    required String title,
    required String description,
    String ministry = 'BOTH',
  }) async {
    await _client.loadToken();
    await _client.dio.post('/discipline', data: {
      'memberId': memberId,
      'ministry': ministry,
      'title': title,
      'description': description,
    });
  }
}
