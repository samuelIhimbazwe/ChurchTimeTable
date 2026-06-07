import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/member_portal_providers.dart';

class BroadcastCenterScreen extends ConsumerWidget {
  const BroadcastCenterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(memberPortalBroadcastsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Broadcast center')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(memberPortalBroadcastsProvider),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Center(child: Text('Unable to load broadcasts')),
          data: (items) {
            if (items.isEmpty) {
              return ListView(
                children: [
                  SizedBox(height: 48),
                  Center(child: Text('No broadcasts yet')),
                ],
              );
            }
            return ListView.builder(
              itemCount: items.length,
              itemBuilder: (_, index) {
                final row = items[index] as Map;
                return ListTile(
                  leading: Icon(
                    row['isLive'] == true ? Icons.live_tv : Icons.ondemand_video,
                  ),
                  title: Text(row['title']?.toString() ?? 'Broadcast'),
                  subtitle: Text(row['broadcastType']?.toString() ?? ''),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
