import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';

class WelfareReportsScreen extends ConsumerStatefulWidget {
  const WelfareReportsScreen({super.key});

  @override
  ConsumerState<WelfareReportsScreen> createState() => _WelfareReportsScreenState();
}

class _WelfareReportsScreenState extends ConsumerState<WelfareReportsScreen> {
  Map<String, dynamic>? _reports;
  bool _loading = true;

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
      final data = await ref.read(choirRepositoryProvider).fetchWelfareReports();
      setState(() {
        _reports = data;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final summary = _reports?['summary'] as Map<String, dynamic>? ?? {};
    return Scaffold(
      appBar: AppBar(title: Text(l10n.welfare_reports_title)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(Spacing.md),
                children: [
                  ListTile(
                    title: Text(l10n.welfare_open_cases),
                    trailing: Text('${summary['activeCases'] ?? 0}'),
                  ),
                  ListTile(
                    title: Text(l10n.welfare_funds_raised),
                    trailing: Text('${summary['totalContributions'] ?? 0}'),
                  ),
                  ListTile(
                    title: Text(l10n.welfare_assistance_total),
                    trailing: Text('${summary['totalAssistance'] ?? 0}'),
                  ),
                ],
              ),
            ),
    );
  }
}
