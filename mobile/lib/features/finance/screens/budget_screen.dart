import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_response.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/widgets/overflow_safe_button.dart';
import '../../auth/providers/auth_provider.dart';

class BudgetScreen extends ConsumerStatefulWidget {
  const BudgetScreen({super.key});

  @override
  ConsumerState<BudgetScreen> createState() => _BudgetScreenState();
}

class _BudgetScreenState extends ConsumerState<BudgetScreen> {
  final _name = TextEditingController();
  final _amount = TextEditingController();
  List<dynamic> _budgets = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _amount.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final api = ref.read(apiClientProvider);
    try {
      await api.loadToken();
      final res = await api.dio.get('/finance/budgets');
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      setState(() => _budgets = (parsed.data?['items'] as List?) ?? []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _create() async {
    final api = ref.read(apiClientProvider);
    final now = DateTime.now();
    final end = now.add(const Duration(days: 90));
    await api.loadToken();
    await api.dio.post('/finance/budgets', data: {
      'name': _name.text,
      'amount': double.tryParse(_amount.text) ?? 0,
      'periodStart': now.toIso8601String(),
      'periodEnd': end.toIso8601String(),
    });
    _name.clear();
    _amount.clear();
    _load();
  }

  Future<void> _delete(String id) async {
    final api = ref.read(apiClientProvider);
    await api.dio.delete('/finance/budgets/$id');
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final formSection = CmmsCard(
      title: l10n.budget_create_action,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _name,
            decoration: InputDecoration(labelText: l10n.budget_name_label),
          ),
          const SizedBox(height: CmmsSpacing.sm),
          TextField(
            controller: _amount,
            decoration: InputDecoration(labelText: l10n.budget_amount_label),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: CmmsSpacing.sm),
          OverflowSafeButton(
            label: l10n.budget_create_action,
            onPressed: _create,
          ),
        ],
      ),
    );

    final listSection = CmmsCard(
      title: l10n.budgets_title,
      child: _loading
          ? Padding(
              padding: const EdgeInsets.symmetric(vertical: CmmsSpacing.md),
              child: Center(child: Text(l10n.common_loading)),
            )
          : Column(
              children: [
                for (final raw in _budgets) ...[
                  Builder(
                    builder: (context) {
                      final budget = raw as Map<String, dynamic>;
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(
                          budget['name'] as String? ?? '',
                          softWrap: true,
                        ),
                        subtitle: Text(
                          l10n.budget_amount_subtitle(budget['amount']),
                          softWrap: true,
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () => _delete(budget['id'] as String),
                        ),
                      );
                    },
                  ),
                  if (raw != _budgets.last) const Divider(height: 1),
                ],
              ],
            ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.budgets_title)),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 960;

          if (isWide) {
            return Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1180),
                child: Padding(
                  padding: const EdgeInsets.all(CmmsSpacing.md),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 360,
                        child: SingleChildScrollView(child: formSection),
                      ),
                      const SizedBox(width: CmmsSpacing.md),
                      Expanded(
                        child: SingleChildScrollView(child: listSection),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }

          return Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: ListView(
                padding: const EdgeInsets.all(CmmsSpacing.md),
                children: [
                  formSection,
                  const SizedBox(height: CmmsSpacing.md),
                  listSection,
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
