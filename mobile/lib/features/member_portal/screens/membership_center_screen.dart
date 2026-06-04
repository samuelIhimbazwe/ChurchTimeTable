import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/member_portal_providers.dart';

class MembershipCenterScreen extends ConsumerWidget {
  const MembershipCenterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(memberPortalMembershipProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Membership center')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(memberPortalMembershipProvider),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('$e')),
          data: (data) {
            final choirs = (data['choirs'] as List?) ?? [];
            final invitations = (data['protocolInvitations'] as List?) ?? [];
            final claims = (data['protocolClaims'] as List?) ?? [];
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  data['isProtocolMember'] == true
                      ? 'Protocol member'
                      : 'Not a protocol member',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                Text('Choir memberships (${choirs.length})',
                    style: Theme.of(context).textTheme.titleSmall),
                ...choirs.map(
                  (c) => ListTile(
                    title: Text(
                      (c as Map)['choir']?['name']?.toString() ?? 'Choir',
                    ),
                  ),
                ),
                const Divider(),
                Text('Protocol invitations (${invitations.length})',
                    style: Theme.of(context).textTheme.titleSmall),
                ...invitations.map(
                  (i) => ListTile(
                    title: Text((i as Map)['status']?.toString() ?? 'PENDING'),
                  ),
                ),
                const Divider(),
                Text('Protocol claims (${claims.length})',
                    style: Theme.of(context).textTheme.titleSmall),
                ...claims.map(
                  (c) => ListTile(
                    title: Text((c as Map)['status']?.toString() ?? ''),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
