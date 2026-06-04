import '../api/api_client.dart';
import '../api/api_response.dart';
import '../../features/member_portal/member_portal_cache.dart';

class MemberPortalRepository {
  MemberPortalRepository({ApiClient? client, MemberPortalCache? cache})
      : _client = client ?? ApiClient(),
        _cache = cache ?? MemberPortalCache();

  final ApiClient _client;
  final MemberPortalCache _cache;

  Future<Map<String, dynamic>> home({bool preferCache = false}) async {
    if (preferCache) {
      final cached = await _cache.loadDashboard();
      if (cached != null) return cached;
    }
    await _client.loadToken();
    final res = await _client.dio.get('/member-portal/home');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    if (!parsed.success || parsed.data == null) {
      throw Exception(parsed.error?.message ?? 'Failed to load member home');
    }
    await _cache.saveDashboard(parsed.data!);
    return parsed.data!;
  }

  Future<Map<String, dynamic>> membership({bool preferCache = false}) async {
    await _client.loadToken();
    final res = await _client.dio.get('/member-portal/membership');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    if (!parsed.success || parsed.data == null) {
      final cached = preferCache ? await _cache.loadMembership() : null;
      if (cached != null) return cached;
      throw Exception(parsed.error?.message ?? 'Failed to load membership');
    }
    await _cache.saveMembership(parsed.data!);
    return parsed.data!;
  }

  Future<List<dynamic>> broadcasts({bool preferCache = false}) async {
    if (preferCache) {
      final cached = await _cache.loadBroadcasts();
      if (cached.isNotEmpty) return cached;
    }
    await _client.loadToken();
    final res = await _client.dio.get('/church/broadcasts');
    final envelope = res.data as Map<String, dynamic>;
    final items = (envelope['data'] as List?) ?? [];
    await _cache.saveBroadcasts(items);
    return items;
  }

  Future<List<dynamic>> invitations({bool preferCache = false}) async {
    if (preferCache) {
      final cached = await _cache.loadInvitations();
      if (cached.isNotEmpty) return cached;
    }
    await _client.loadToken();
    final res = await _client.dio.get('/protocol/invitations/mine');
    final envelope = res.data as Map<String, dynamic>;
    final items = (envelope['data'] as List?) ?? [];
    await _cache.saveInvitations(items);
    return items;
  }

  Future<List<dynamic>> joinRequests({bool preferCache = false}) async {
    if (preferCache) {
      final cached = await _cache.loadRequests();
      if (cached.isNotEmpty) return cached;
    }
    final membership = await this.membership(preferCache: preferCache);
    final items = (membership['joinRequests'] as List?) ?? [];
    await _cache.saveRequests(items);
    return items;
  }
}
