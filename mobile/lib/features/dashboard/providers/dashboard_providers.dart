import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/locale_provider.dart';
import '../../../core/models/dashboard_models.dart';
import '../../../core/repositories/dashboard_repository.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return DashboardRepository(client: ref.watch(apiClientProvider));
});

final leaderDashboardProvider = FutureProvider<LeaderDashboardSummary>((ref) async {
  final repo = ref.watch(dashboardRepositoryProvider);
  return repo.leaderSummary();
});

final memberDashboardProvider = FutureProvider<MemberDashboardSummary>((ref) async {
  final repo = ref.watch(dashboardRepositoryProvider);
  return repo.memberSummary();
});

final operationalDashboardProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, role) async {
  final repo = ref.watch(dashboardRepositoryProvider);
  return repo.operationalSummary(role);
});
