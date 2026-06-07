import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/member_portal_providers.dart';

class MemberInvitationsScreen extends ConsumerWidget {
  const MemberInvitationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(memberPortalInvitationsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Invitations')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(memberPortalInvitationsProvider),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Center(child: Text('Unable to load invitations')),
          data: (items) {
            if (items.isEmpty) {
              return ListView(
                children: [
                  SizedBox(height: 48),
                  Center(child: Text('No invitations')),
                ],
              );
            }
            return ListView.builder(
              itemCount: items.length,
              itemBuilder: (_, index) {
                final row = items[index] as Map;
                return ListTile(
                  title: Text(row['status']?.toString() ?? 'PENDING'),
                  subtitle: Text(row['expiresAt']?.toString() ?? ''),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
