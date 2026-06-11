import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/routing/app_router.dart';
import '../providers/member_portal_providers.dart';

/// Member portal home — summary and navigation to portal areas.
class MemberHomeScreen extends ConsumerWidget {
  const MemberHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homeAsync = ref.watch(memberPortalHomeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Member home'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.of(context).pushNamed(AppRouter.notifications),
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
              const Text('Showing offline navigation (network unavailable).'),
              const SizedBox(height: 16),
              ..._navTiles(context),
            ],
          ),
          data: (data) {
            final summary = data['summary'] as Map<String, dynamic>?;
            final live = (data['broadcasts'] as List?)?.length ?? 0;
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (summary != null)
                  Card(
                    child: ListTile(
                      title: Text(summary['displayName']?.toString() ?? 'Member'),
                      subtitle: Text(
                        'Choirs: ${(summary['myChoirs'] as List?)?.length ?? 0} · '
                        'Protocol: ${summary['protocolStatus'] ?? 'NONE'}',
                      ),
                    ),
                  ),
                ListTile(
                  leading: const Icon(Icons.live_tv),
                  title: const Text('Live & recent broadcasts'),
                  trailing: Text('$live'),
                ),
                const SizedBox(height: 8),
                ..._navTiles(context),
              ],
            );
          },
        ),
      ),
    );
  }

  List<Widget> _navTiles(BuildContext context) {
    return [
      ListTile(
        leading: const Icon(Icons.group_outlined),
        title: const Text('Membership center'),
        subtitle: const Text('Choir and protocol membership'),
        onTap: () => Navigator.of(context).pushNamed(AppRouter.memberPortalMembership),
      ),
      ListTile(
        leading: const Icon(Icons.campaign_outlined),
        title: const Text('Broadcast center'),
        subtitle: const Text('Church live streams and announcements'),
        onTap: () => Navigator.of(context).pushNamed(AppRouter.memberPortalBroadcasts),
      ),
      ListTile(
        leading: const Icon(Icons.mail_outline),
        title: const Text('Invitations'),
        subtitle: const Text('Protocol invitations'),
        onTap: () => Navigator.of(context).pushNamed(AppRouter.memberPortalInvitations),
      ),
      ListTile(
        leading: const Icon(Icons.pending_actions_outlined),
        title: const Text('Requests'),
        subtitle: const Text('Choir join and membership requests'),
        onTap: () => Navigator.of(context).pushNamed(AppRouter.memberPortalRequests),
      ),
      ListTile(
        leading: const Icon(Icons.volunteer_activism_outlined),
        title: const Text('My contributions'),
        subtitle: const Text('History and submit choir claims'),
        onTap: () => Navigator.of(context).pushNamed(AppRouter.myContributions),
      ),
      ListTile(
        leading: const Icon(Icons.shield_outlined),
        title: const Text('Protocol'),
        subtitle: const Text('Contributions and service assignments'),
        onTap: () => Navigator.of(context).pushNamed(AppRouter.protocolDashboard),
      ),
    ];
  }
}
