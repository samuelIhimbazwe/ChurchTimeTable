import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/governance_permissions.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';
import 'welfare_assistance_screen.dart';

class WelfareCaseDetailScreen extends ConsumerStatefulWidget {
  const WelfareCaseDetailScreen({super.key, required this.caseId});

  final String caseId;

  @override
  ConsumerState<WelfareCaseDetailScreen> createState() =>
      _WelfareCaseDetailScreenState();
}

class _WelfareCaseDetailScreenState extends ConsumerState<WelfareCaseDetailScreen>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _case;
  List<Map<String, dynamic>> _timeline = const [];
  String? _error;
  bool _loading = true;
  bool _offline = false;
  final _amountController = TextEditingController();
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _tabs.dispose();
    super.dispose();
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
      final caseData = await repo.fetchWelfareCase(widget.caseId);
      List<Map<String, dynamic>> timeline = const [];
      try {
        timeline = await repo.fetchWelfareTimeline(widget.caseId);
      } catch (_) {}
      setState(() {
        _case = caseData;
        _timeline = timeline;
        _loading = false;
      });
    } catch (e) {
      final repo = ref.read(choirRepositoryProvider);
      final cached = await repo.fetchWelfareCase(widget.caseId, offlineFallback: true);
      setState(() {
        _case = cached.isNotEmpty ? cached : null;
        _error = cached.isEmpty ? e.toString() : null;
        _offline = cached.isNotEmpty;
        _loading = false;
      });
    }
  }

  Future<void> _contribute() async {
    final amount = double.tryParse(_amountController.text.trim());
    if (amount == null || amount <= 0) return;
    final api = ref.read(apiClientProvider);
    await api.loadToken();
    await ref.read(choirRepositoryProvider).submitWelfareContribution(
          caseId: widget.caseId,
          amount: amount,
        );
    _amountController.clear();
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final perms = ref.watch(authProvider).permissions;
    final canManage = canManageWelfare(perms);

    return Scaffold(
      appBar: AppBar(
        title: Text(_case?['title']?.toString() ?? l10n.welfare_title),
        bottom: TabBar(
          controller: _tabs,
          tabs: [
            Tab(text: l10n.welfare_tab_overview),
            Tab(text: l10n.welfare_timeline),
            Tab(text: l10n.welfare_contributions),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                if (_offline)
                  MaterialBanner(
                    content: Text(l10n.welfare_offline_banner),
                    actions: [
                      TextButton(onPressed: _load, child: Text(l10n.common_retry)),
                    ],
                  ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.all(Spacing.sm),
                    child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  ),
                Expanded(
                  child: TabBarView(
                    controller: _tabs,
                    children: [
                      _overviewTab(l10n, canManage),
                      _timelineTab(l10n),
                      _contributionsTab(l10n),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _overviewTab(dynamic l10n, bool canManage) {
    if (_case == null) return const SizedBox.shrink();
    return ListView(
      padding: const EdgeInsets.all(Spacing.md),
      children: [
        Text(_case!['description']?.toString() ?? ''),
        const SizedBox(height: Spacing.sm),
        Text('${l10n.welfare_raised}: ${_case!['raisedAmount']}'),
        Text('${l10n.welfare_remaining}: ${_case!['remainingAmount']}'),
        Text('${l10n.welfare_category}: ${(_case!['category'] as Map?)?['name'] ?? ''}'),
        if (canManage) ...[
          const SizedBox(height: Spacing.md),
          FilledButton(
            onPressed: () async {
              final ok = await Navigator.of(context).push<bool>(
                MaterialPageRoute(
                  builder: (_) => WelfareAssistanceScreen(caseId: widget.caseId),
                ),
              );
              if (ok == true) await _load();
            },
            child: Text(l10n.welfare_record_assistance),
          ),
        ],
      ],
    );
  }

  Widget _timelineTab(dynamic l10n) {
    if (_timeline.isEmpty) {
      return Center(child: Text(l10n.welfare_timeline_empty));
    }
    return ListView.builder(
      itemCount: _timeline.length,
      itemBuilder: (_, i) {
        final row = _timeline[i];
        return ListTile(
          title: Text(row['label']?.toString() ?? row['type']?.toString() ?? ''),
          subtitle: Text(row['at']?.toString() ?? ''),
        );
      },
    );
  }

  Widget _contributionsTab(dynamic l10n) {
    final rows = (_case?['contributions'] as List? ?? const [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
    return ListView(
      padding: const EdgeInsets.all(Spacing.md),
      children: [
        ...rows.map(
          (row) => ListTile(
            title: Text('${row['amount']}'),
            subtitle: Text(row['paymentAt']?.toString() ?? ''),
          ),
        ),
        const Divider(),
        TextField(
          controller: _amountController,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(labelText: l10n.welfare_amount),
        ),
        FilledButton(
          onPressed: _contribute,
          child: Text(l10n.welfare_contribute),
        ),
      ],
    );
  }
}
