import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/widgets/mobile_tab_shell.dart';
import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';
import 'rehearsal_detail_screen.dart';

class RehearsalsScreen extends ConsumerStatefulWidget {
  const RehearsalsScreen({super.key});

  @override
  ConsumerState<RehearsalsScreen> createState() => _RehearsalsScreenState();
}

class _RehearsalsScreenState extends ConsumerState<RehearsalsScreen> {
  Map<String, dynamic>? _dashboard;
  List<Map<String, dynamic>> _items = const [];
  bool _loading = true;
  bool _offline = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final repo = ref.read(choirRepositoryProvider);
      final dash = await repo.fetchRehearsalDashboard();
      final items = (dash['upcomingRehearsals'] as List? ?? const [])
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      setState(() {
        _dashboard = dash;
        _items = items;
        _loading = false;
        _offline = false;
      });
    } catch (_) {
      final dash = await ref.read(choirRepositoryProvider).fetchRehearsalDashboard(offlineFallback: true);
      final items = (dash['upcomingRehearsals'] as List? ?? const [])
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      setState(() {
        _dashboard = dash;
        _items = items;
        _offline = items.isNotEmpty;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return MobileTabShell(
      title: l10n.rehearsals_title,
      child: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(Spacing.md),
                children: [
                  if (_offline) Text(l10n.welfare_offline_banner),
                  if (_dashboard != null) ...[
                    Text('${l10n.rehearsals_prep_score}: ${_dashboard!['servicePrepScore'] ?? 0}%'),
                    Text('${l10n.welfare_open_cases}: ${_dashboard!['attendanceRate'] ?? 0}%'),
                    const SizedBox(height: Spacing.md),
                  ],
                  ..._items.map((item) {
                    final readiness =
                        (item['readiness'] as Map<String, dynamic>?)?['overall'] ?? 0;
                    return ListTile(
                      title: Text(item['title']?.toString() ?? ''),
                      subtitle: Text('${l10n.rehearsals_readiness}: $readiness%'),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => RehearsalDetailScreen(
                              eventId: item['id'].toString(),
                              eventTitle: item['title']?.toString() ?? '',
                            ),
                          ),
                        );
                      },
                    );
                  }),
                ],
              ),
      ),
    );
  }
}
