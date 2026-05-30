import '../api/api_client.dart';
import '../api/api_response.dart';

class CoverageRepository {
  CoverageRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<Map<String, dynamic>> analytics() async {
    await _client.loadToken();
    final res = await _client.dio.get('/coverage/analytics');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return parsed.data ?? {};
  }

  Future<List<Map<String, dynamic>>> readiness() async {
    await _client.loadToken();
    final res = await _client.dio.get('/coverage/readiness');
    final parsed = ApiResponse<dynamic>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => d,
    );
    final data = parsed.data;
    if (data is List) {
      return data
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    }
    return [];
  }

  Future<Map<String, dynamic>> teamHeadSummary() async {
    await _client.loadToken();
    final res = await _client.dio.get('/coverage/operational/team-head');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return parsed.data ?? {};
  }

  Future<Map<String, dynamic>> coordinatorSummary() async {
    await _client.loadToken();
    final res = await _client.dio.get('/coverage/operational/coordinator');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return parsed.data ?? {};
  }

  Future<void> escalateSwap(
    String swapId,
    String level, {
    String? reason,
  }) async {
    await _client.loadToken();
    await _client.dio.post(
      '/coverage/swaps/$swapId/escalate',
      data: {'level': level, if (reason != null) 'reason': reason},
    );
  }

  Future<void> escalateReplacement(
    String replacementId,
    String level, {
    String? reason,
  }) async {
    await _client.loadToken();
    await _client.dio.post(
      '/coverage/replacements/$replacementId/escalate',
      data: {'level': level, if (reason != null) 'reason': reason},
    );
  }
}
