import '../../../core/api/api_client.dart';
import '../../../core/api/api_response.dart';

class ProtocolRepository {
  ProtocolRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<Map<String, dynamic>?> getDashboard() async {
    await _client.loadToken();
    final res = await _client.dio.get('/protocol/dashboard/me');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return parsed.data;
  }

  Future<List<dynamic>> getAttendanceHistory() async {
    await _client.loadToken();
    final res = await _client.dio.get('/protocol/attendance/history');
    final parsed = ApiResponse<List<dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => (d as List?) ?? [],
    );
    return parsed.data ?? [];
  }

  Future<List<Map<String, dynamic>>> listMembers() async {
    await _client.loadToken();
    final res = await _client.dio.get('/protocol/members');
    final parsed = ApiResponse<List<dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => (d as List?) ?? [],
    );
    return (parsed.data ?? [])
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList();
  }

  Future<void> requestReplacement({
    required String teamMemberId,
    required String replacementMemberId,
    String? reason,
  }) async {
    await _client.loadToken();
    await _client.dio.post('/protocol/replacements', data: {
      'teamMemberId': teamMemberId,
      'replacementMemberId': replacementMemberId,
      if (reason != null && reason.isNotEmpty) 'reason': reason,
    });
  }

  Future<List<Map<String, dynamic>>> listPendingReplacements() async {
    await _client.loadToken();
    final res = await _client.dio.get('/protocol/replacements');
    final parsed = ApiResponse<List<dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => (d as List?) ?? [],
    );
    return (parsed.data ?? [])
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList();
  }

  Future<void> reviewReplacement(String id, String status) async {
    await _client.loadToken();
    await _client.dio.patch('/protocol/replacements/$id', data: {'status': status});
  }
}
