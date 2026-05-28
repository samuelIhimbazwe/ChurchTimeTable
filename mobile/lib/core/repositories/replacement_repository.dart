import '../api/api_client.dart';
import '../api/api_response.dart';

class ReplacementRepository {
  ReplacementRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<List<dynamic>> list() async {
    await _client.loadToken();
    final res = await _client.dio.get('/replacements');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return (parsed.data?['items'] as List?) ?? [];
  }

  Future<void> create({
    required String eventId,
    required String absentMemberId,
    String? coverMemberId,
    bool selfFound = false,
    String? notes,
  }) async {
    await _client.loadToken();
    await _client.dio.post('/replacements', data: {
      'eventId': eventId,
      'absentMemberId': absentMemberId,
      if (coverMemberId != null) 'coverMemberId': coverMemberId,
      'selfFound': selfFound,
      if (notes != null) 'notes': notes,
    });
  }

  Future<void> approve(String id) async {
    await _client.loadToken();
    await _client.dio.patch('/replacements/$id/approve');
  }

  Future<void> finalize(String id) async {
    await _client.loadToken();
    await _client.dio.patch('/replacements/$id/finalize');
  }
}
