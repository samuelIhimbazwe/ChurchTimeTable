import '../api/api_client.dart';
import '../api/api_response.dart';

class SwapRepository {
  SwapRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<List<dynamic>> list({String? status}) async {
    await _client.loadToken();
    final res = await _client.dio.get(
      '/swaps',
      queryParameters: {if (status != null) 'status': status},
    );
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return (parsed.data?['items'] as List?) ?? [];
  }

  Future<void> request(String eventId, String targetId) async {
    await _client.loadToken();
    await _client.dio.post('/swaps', data: {
      'eventId': eventId,
      'targetId': targetId,
    });
  }

  Future<void> respond(String swapId, bool accept) async {
    await _client.loadToken();
    await _client.dio.patch('/swaps/$swapId/respond', data: {'accept': accept});
  }

  Future<void> approve(String swapId, {String? notes}) async {
    await _client.loadToken();
    await _client.dio.patch('/swaps/$swapId/approve', data: {'notes': notes});
  }

  Future<void> finalize(String swapId) async {
    await _client.loadToken();
    await _client.dio.patch('/swaps/$swapId/finalize');
  }
}
