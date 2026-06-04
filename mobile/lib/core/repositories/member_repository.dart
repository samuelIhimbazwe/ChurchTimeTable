import '../api/api_client.dart';
import '../api/api_response.dart';

class MemberRepository {
  MemberRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<List<Map<String, dynamic>>> list({int limit = 200}) async {
    await _client.loadToken();
    final res = await _client.dio.get(
      '/members/roster',
      queryParameters: {'limit': limit, 'status': 'ACTIVE'},
    );
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return ((parsed.data?['items'] as List?) ?? [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }

  Future<Map<String, dynamic>> profileCenter(String memberId) async {
    await _client.loadToken();
    final res = await _client.dio.get('/members/$memberId/profile');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    if (!parsed.success || parsed.data == null) {
      throw Exception(parsed.error?.message ?? 'Failed to load profile');
    }
    return parsed.data!;
  }

  Future<List<dynamic>> timeline(String memberId, {int limit = 100}) async {
    await _client.loadToken();
    final res = await _client.dio.get(
      '/members/$memberId/timeline',
      queryParameters: {'limit': limit},
    );
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    if (!parsed.success || parsed.data == null) {
      throw Exception(parsed.error?.message ?? 'Failed to load timeline');
    }
    return (parsed.data!['events'] as List?) ?? [];
  }
}
