import '../api/api_client.dart';
import '../api/api_response.dart';
import '../models/dashboard_models.dart';

class DashboardRepository {
  DashboardRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<LeaderDashboardSummary> leaderSummary() async {
    await _client.loadToken();
    final res = await _client.dio.get('/dashboard/leader-summary');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return LeaderDashboardSummary.fromJson(parsed.data ?? {});
  }

  Future<Map<String, dynamic>> operationalSummary(String role) async {
    await _client.loadToken();
    final res = await _client.dio.get('/dashboard/operational/$role');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return parsed.data ?? {};
  }

  Future<MemberDashboardSummary> memberSummary() async {
    await _client.loadToken();
    final res = await _client.dio.get('/dashboard/member-summary');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    return MemberDashboardSummary.fromJson(parsed.data ?? {});
  }
}
