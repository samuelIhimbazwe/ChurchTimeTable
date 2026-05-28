import '../api/api_client.dart';
import '../api/api_response.dart';

class SyncRepository {
  SyncRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<List<Map<String, dynamic>>> conflicts() async {
    await _client.loadToken();
    final res = await _client.dio.get('/sync/conflicts');
    final parsed = ApiResponse<List<dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => d as List<dynamic>,
    );
    return (parsed.data ?? [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }
}
