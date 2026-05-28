import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';

import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/repositories/sync_repository.dart';
import '../../../core/services/sync_service.dart';

class SyncStatusScreen extends ConsumerStatefulWidget {
  const SyncStatusScreen({super.key});

  @override
  ConsumerState<SyncStatusScreen> createState() => _SyncStatusScreenState();
}

class _SyncStatusScreenState extends ConsumerState<SyncStatusScreen> {
  SyncResult? _lastResult;
  bool _syncing = false;
  List<Map<String, dynamic>> _conflicts = [];
  bool _loadingConflicts = true;

  @override
  void initState() {
    super.initState();
    _loadConflicts();
  }

  Future<void> _loadConflicts() async {
    setState(() => _loadingConflicts = true);
    try {
      final repo = SyncRepository(client: ref.read(apiClientProvider));
      final list = await repo.conflicts();
      if (mounted) setState(() {
        _conflicts = list;
        _loadingConflicts = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingConflicts = false);
    }
  }

  Future<void> _sync() async {
    final l10n = context.l10n;
    setState(() => _syncing = true);
    final result = await ref.read(syncServiceProvider).syncIfOnline();
    final cache = Hive.box('cache');
    await cache.put('last_sync_at', DateTime.now().toUtc().toIso8601String());
    setState(() {
      _lastResult = result;
      _syncing = false;
    });
    await _loadConflicts();
    if (!mounted) return;
    if (result.skipped && result.message != null) {
      final msg = result.message == 'Offline'
          ? l10n.sync_offline_skipped
          : result.message == 'Queue empty'
              ? l10n.sync_queue_empty_skipped
              : result.message!;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    }
  }

  String? _lastSyncLabel() {
    final raw = Hive.box('cache').get('last_sync_at') as String?;
    if (raw == null) return null;
    return raw;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final sync = ref.watch(syncServiceProvider);
    final pending = sync.pendingCount;
    final items = sync.pendingItems;
    final lastSync = _lastSyncLabel();
    final rejected = _lastResult?.rejected ?? 0;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.sync_title)),
      body: RefreshIndicator(
        onRefresh: () async {
          await _sync();
        },
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1100),
            child: ListView(
              padding: const EdgeInsets.all(CmmsSpacing.md),
              children: [
                CmmsCard(
                  title: l10n.sync_pending_count,
                  child: Column(
                    children: [
                      Text(
                        '$pending',
                        style: Theme.of(context).textTheme.displayMedium,
                      ),
                      Text(l10n.sync_pending_hint, textAlign: TextAlign.center),
                      if (lastSync != null) ...[
                        const SizedBox(height: CmmsSpacing.xs),
                        Text(
                          '${l10n.sync_last_sync}: $lastSync',
                          softWrap: true,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                      if (rejected > 0)
                        Text(
                          l10n.sync_failed_count(rejected),
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                    ],
                  ),
                ),
              const SizedBox(height: CmmsSpacing.md),
                CmmsButton(
                  label: l10n.sync_now_action,
                  icon: Icons.cloud_upload,
                  onPressed: _syncing ? null : _sync,
                  isLoading: _syncing,
                ),
                if (_lastResult != null && !_lastResult!.skipped) ...[
                  const SizedBox(height: CmmsSpacing.md),
                  Text(
                    l10n.sync_result_applied(
                      _lastResult!.applied,
                      _lastResult!.rejected,
                    ),
                    softWrap: true,
                  ),
                ],
                const SizedBox(height: CmmsSpacing.lg),
                Text(
                  l10n.sync_queued_items_title,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                ...items.map(
                  (item) => ListTile(
                    title: Text(item['entity'] as String? ?? ''),
                    subtitle: Text(item['entityId'] as String? ?? ''),
                    trailing: IconButton(
                      icon: const Icon(Icons.refresh),
                      tooltip: l10n.sync_retry_action,
                      onPressed: _syncing ? null : _sync,
                    ),
                  ),
                ),
                const SizedBox(height: CmmsSpacing.lg),
                Text(
                  l10n.sync_conflicts_title,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                if (_loadingConflicts)
                  Padding(
                    padding: const EdgeInsets.all(CmmsSpacing.sm),
                    child: Text(l10n.common_loading),
                  )
                else if (_conflicts.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(CmmsSpacing.sm),
                    child: Text(l10n.sync_queue_empty_skipped),
                  )
                else
                  ..._conflicts.map(
                    (c) => CmmsCard(
                      title: c['entity'] as String? ?? '',
                      subtitle: c['entityId'] as String?,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${l10n.sync_conflict_reason}: ${c['reason'] ?? ''}',
                            softWrap: true,
                          ),
                          const SizedBox(height: CmmsSpacing.xs),
                          CmmsButton(
                            label: l10n.sync_retry_action,
                            variant: CmmsButtonVariant.secondary,
                            onPressed: _syncing ? null : _sync,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
