import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/locale_provider.dart';
import '../../../core/repositories/member_portal_repository.dart';

final memberPortalRepositoryProvider = Provider<MemberPortalRepository>((ref) {
  return MemberPortalRepository(client: ref.watch(apiClientProvider));
});

final memberPortalHomeProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final repo = ref.watch(memberPortalRepositoryProvider);
  try {
    return await repo.home();
  } catch (_) {
    return repo.home(preferCache: true);
  }
});

final memberPortalMembershipProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final repo = ref.watch(memberPortalRepositoryProvider);
  try {
    return await repo.membership();
  } catch (_) {
    return repo.membership(preferCache: true);
  }
});

final memberPortalBroadcastsProvider = FutureProvider<List<dynamic>>((ref) async {
  final repo = ref.watch(memberPortalRepositoryProvider);
  try {
    return await repo.broadcasts();
  } catch (_) {
    return repo.broadcasts(preferCache: true);
  }
});

final memberPortalInvitationsProvider = FutureProvider<List<dynamic>>((ref) async {
  final repo = ref.watch(memberPortalRepositoryProvider);
  try {
    return await repo.invitations();
  } catch (_) {
    return repo.invitations(preferCache: true);
  }
});

final memberPortalRequestsProvider = FutureProvider<List<dynamic>>((ref) async {
  final repo = ref.watch(memberPortalRepositoryProvider);
  try {
    return await repo.joinRequests();
  } catch (_) {
    return repo.joinRequests(preferCache: true);
  }
});
