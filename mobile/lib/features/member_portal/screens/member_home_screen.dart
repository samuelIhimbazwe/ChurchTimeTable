import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/portal/dual_member_portal_access.dart';
import '../../../core/routing/app_router.dart';
import '../providers/member_portal_providers.dart';

/// Member portal home — choir + protocol summary for dual members.
class MemberHomeScreen extends ConsumerWidget {
  const MemberHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homeAsync = ref.watch(memberPortalHomeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Member portal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () =>
                Navigator.of(context).pushNamed(AppRouter.notifications),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(memberPortalHomeProvider);
          ref.invalidate(memberPortalMembershipProvider);
        },
        child: homeAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('Could not load portal — pull to retry.'),
              const SizedBox(height: 16),
              ..._navTiles(context, const DualMemberPortalAccess(
                isDualMember: true,
                hasChoirMembership: true,
                hasProtocolMembership: true,
              )),
            ],
          ),
          data: (data) {
            final access = DualMemberPortalAccess.fromHomeData(data);
            final welcome = data['welcome'] as Map<String, dynamic>?;
            final participation =
                data['participation'] as Map<String, dynamic>?;
            final weekCount =
                (participation?['thisWeek'] as List?)?.length ?? 0;
            final conflictCount =
                (participation?['conflicts'] as List?)?.length ?? 0;

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (welcome != null)
                  Card(
                    child: ListTile(
                      title: Text(
                        welcome['displayName']?.toString() ?? 'Member',
                      ),
                      subtitle: Text(
                        'Choir & protocol member · '
                        '$weekCount commitment${weekCount == 1 ? '' : 's'} this week'
                        '${conflictCount > 0 ? ' · $conflictCount conflict${conflictCount == 1 ? '' : 's'}' : ''}',
                      ),
                    ),
                  ),
                const SizedBox(height: 8),
                ..._navTiles(context, access),
              ],
            );
          },
        ),
      ),
    );
  }

  List<Widget> _navTiles(
    BuildContext context,
    DualMemberPortalAccess access,
  ) {
    final tiles = <Widget>[
      ListTile(
        leading: const Icon(Icons.group_outlined),
        title: const Text('Membership center'),
        subtitle: const Text('Choir and protocol membership'),
        onTap: () =>
            Navigator.of(context).pushNamed(AppRouter.memberPortalMembership),
      ),
    ];

    if (access.primaryChoirId != null) {
      final choirId = access.primaryChoirId!;
      tiles.add(
        ListTile(
          leading: const Icon(Icons.music_note_outlined),
          title: const Text('Choir assignments'),
          subtitle: const Text('Service prep and singing schedule'),
          onTap: () => Navigator.of(context).pushNamed(
            AppRouter.choirAssignments,
            arguments: choirId,
          ),
        ),
      );
    }

    tiles.add(
      ListTile(
        leading: const Icon(Icons.shield_outlined),
        title: const Text('Protocol dashboard'),
        subtitle: const Text('Teams, attendance, and service assignments'),
        onTap: () =>
            Navigator.of(context).pushNamed(AppRouter.protocolDashboard),
      ),
    );

    return tiles;
  }
}
