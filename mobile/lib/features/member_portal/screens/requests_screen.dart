import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/member_portal_providers.dart';

class MemberRequestsScreen extends ConsumerWidget {
  const MemberRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(memberPortalRequestsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Requests')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(memberPortalRequestsProvider),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Center(child: Text('Unable to load requests')),
          data: (items) {
            if (items.isEmpty) {
              return ListView(
                children: [
                  SizedBox(height: 48),
                  Center(child: Text('No pending requests')),
                ],
              );
            }
            return ListView.builder(
              itemCount: items.length,
              itemBuilder: (_, index) {
                final row = items[index] as Map;
                final choir = row['choir'] as Map?;
                return ListTile(
                  title: Text(choir?['name']?.toString() ?? 'Choir request'),
                  subtitle: Text(row['status']?.toString() ?? ''),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
