import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/repositories/swap_repository.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/widgets/shell_aware_scaffold.dart';
import 'swap_detail_screen.dart';

class SwapListScreen extends ConsumerStatefulWidget {
  const SwapListScreen({super.key});

  @override
  ConsumerState<SwapListScreen> createState() => _SwapListScreenState();
}

class _SwapListScreenState extends ConsumerState<SwapListScreen> {
  final _repo = SwapRepository();
  List<dynamic> _swaps = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _swaps = await _repo.list();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isLeader = ref.watch(authProvider).isLeader;

    return ShellAwareScaffold(
      title: l10n.swap_list_title,
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh),
          tooltip: l10n.common_refresh,
          onPressed: _load,
        ),
      ],
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const SwapDetailScreen()),
          );
          _load();
        },
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? Center(child: Text(l10n.common_loading))
          : Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 960),
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: _swaps.length,
                  itemBuilder: (_, i) {
                    final s = _swaps[i] as Map<String, dynamic>;
                    final status = s['status'] as String? ?? '';
                    final eventName =
                        s['event']?['title'] as String? ??
                        s['eventId']?.toString() ??
                        '';
                    final statusLabel = l10n.swapStatusLabel(status);
                    return ListTile(
                      title: Text(statusLabel, softWrap: true),
                      subtitle: Text(
                        l10n.swap_list_item_subtitle(eventName, statusLabel),
                        softWrap: true,
                      ),
                      trailing: isLeader && status == 'LEADER_PENDING'
                          ? const Icon(Icons.approval, color: Colors.orange)
                          : null,
                      onTap: () async {
                        await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => SwapDetailScreen(swap: s),
                          ),
                        );
                        _load();
                      },
                    );
                  },
                ),
              ),
            ),
    );
  }
}
