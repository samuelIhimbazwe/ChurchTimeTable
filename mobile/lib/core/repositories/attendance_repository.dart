import '../api/api_client.dart';
import '../api/api_response.dart';

class AttendanceRepository {
  AttendanceRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

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
}
