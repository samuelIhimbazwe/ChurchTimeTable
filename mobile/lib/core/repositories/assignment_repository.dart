import '../api/api_client.dart';
import '../api/api_response.dart';

class AssignmentRepository {
  AssignmentRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<List<Map<String, dynamic>>> byEvent(String eventId) async {
    await _client.loadToken();
    final res = await _client.dio.get(
      '/assignments/event/$eventId',
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
}
