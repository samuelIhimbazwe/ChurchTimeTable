import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/governance_permissions.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/components/cards/cmms_stat_tile.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/routing/app_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';
import 'welfare_case_detail_screen.dart';
import 'welfare_create_screen.dart';
import 'welfare_reports_screen.dart';

class WelfareScreen extends ConsumerStatefulWidget {
  const WelfareScreen({super.key});

  @override
  ConsumerState<WelfareScreen> createState() => _WelfareScreenState();
}

class _WelfareScreenState extends ConsumerState<WelfareScreen> {
  List<Map<String, dynamic>> _cases = const [];
  Map<String, dynamic>? _dashboard;
  String? _error;
  bool _loading = true;
  bool _offline = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _offline = false;
    });
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final repo = ref.read(choirRepositoryProvider);
      final dash = await repo.fetchWelfareDashboard();
      final items = await repo.fetchWelfareCases();
      setState(() {
        _dashboard = dash;
        _cases = items;
        _loading = false;
      });
    } catch (e) {
      final repo = ref.read(choirRepositoryProvider);
      final cachedDash = await repo.fetchWelfareDashboard(offlineFallback: true);
      final cachedCases = await repo.fetchWelfareCases(offlineFallback: true);
      setState(() {
        _dashboard = cachedDash.isNotEmpty ? cachedDash : null;
        _cases = cachedCases;
        _error = cachedCases.isEmpty ? e.toString() : null;
        _offline = cachedCases.isNotEmpty;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final perms = ref.watch(authProvider).permissions;
    final canManage = canManageWelfare(perms);

    return RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(Spacing.md),
                children: [
                  if (_offline)
                    Text(l10n.welfare_offline_banner, style: Theme.of(context).textTheme.bodySmall),
                  if (_error != null)
                    Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  if (canManage)
                    Row(
                      children: [
                        FilledButton(
                          onPressed: () async {
                            final ok = await Navigator.of(context).push<bool>(
                              MaterialPageRoute(builder: (_) => const WelfareCreateScreen()),
                            );
                            if (ok == true) await _load();
                          },
                          child: Text(l10n.welfare_create_title),
                        ),
                        const SizedBox(width: Spacing.sm),
                        OutlinedButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const WelfareReportsScreen()),
                            );
                          },
                          child: Text(l10n.welfare_reports_title),
                        ),
                      ],
                    ),
                  if (_dashboard != null) ...[
                    Row(
                      children: [
                        Expanded(
                          child: CmmsStatTile(
                            label: l10n.welfare_open_cases,
                            value: '${_dashboard!['openCases'] ?? 0}',
                            icon: Icons.volunteer_activism_outlined,
                            accent: true,
                          ),
                        ),
                        const SizedBox(width: Spacing.sm),
                        Expanded(
                          child: CmmsStatTile(
                            label: l10n.welfare_funds_raised,
                            value: '${_dashboard!['fundsRaised'] ?? 0}',
                            icon: Icons.payments_outlined,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: Spacing.md),
                  ],
                  ..._cases.map((item) {
                    final member = item['member'] as Map<String, dynamic>? ?? {};
                    return CmmsCard(
                      title: item['title']?.toString() ?? '',
                      subtitle:
                          '${member['firstName'] ?? ''} ${member['lastName'] ?? ''} · ${item['status']}',
                      leading: const Icon(Icons.folder_open_outlined),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => WelfareCaseDetailScreen(
                              caseId: item['id'].toString(),
                            ),
                          ),
                        );
                      },
                    );
                  }),
                ],
              ),
    );
  }
}
