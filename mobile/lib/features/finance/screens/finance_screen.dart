import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_response.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/routing/app_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/widgets/shell_aware_scaffold.dart';

class FinanceScreen extends ConsumerStatefulWidget {
  const FinanceScreen({super.key});

  @override
  ConsumerState<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends ConsumerState<FinanceScreen> {
  Map<String, dynamic>? _summary;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = ref.read(apiClientProvider);
    await api.loadToken();
    final res = await api.dio.get('/finance/stewardship/analytics');
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    setState(() => _summary = parsed.data);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return ShellAwareScaffold(
      title: l10n.finance_summary_title,
      actions: [
        IconButton(
          icon: const Icon(Icons.receipt_long_outlined),
          tooltip: l10n.my_contributions_title,
          onPressed: () =>
              Navigator.pushNamed(context, AppRouter.myContributions),
        ),
        IconButton(
          icon: const Icon(Icons.savings),
          onPressed: () => Navigator.pushNamed(context, AppRouter.budgets),
        ),
      ],
      body: _summary == null
          ? Center(child: Text(l10n.common_loading))
          : Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1120),
                child: ListView(
                  padding: const EdgeInsets.all(CmmsSpacing.md),
                  children: [
                    GridView.extent(
                      maxCrossAxisExtent: 260,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: CmmsSpacing.md,
                      crossAxisSpacing: CmmsSpacing.md,
                      childAspectRatio: 1.4,
                      children: [
                        _StatCard(
                          label: l10n.finance_income_label,
                          value: _summary!['income'] ?? 0,
                          icon: Icons.trending_up,
                        ),
                        _StatCard(
                          label: l10n.finance_expense_label,
                          value: _summary!['expense'] ?? 0,
                          icon: Icons.trending_down,
                        ),
                        _StatCard(
                          label: l10n.finance_balance_label,
                          value: _summary!['balance'] ?? 0,
                          icon: Icons.account_balance_wallet,
                        ),
                        if ((_summary!['unpaidBalance'] as num?) != null &&
                            (_summary!['unpaidBalance'] as num) > 0)
                          _StatCard(
                            label: l10n.finance_unpaid_label,
                            value: _summary!['unpaidBalance'],
                            icon: Icons.warning_amber_outlined,
                          ),
                        CmmsCard(
                          title: l10n.budgets_title,
                          subtitle: l10n.finance_summary_title,
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: FilledButton.icon(
                              onPressed: () =>
                                  Navigator.pushNamed(context, AppRouter.budgets),
                              icon: const Icon(Icons.savings),
                              label: Text(l10n.budgets_title),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final dynamic value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return CmmsCard(
      title: null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: CmmsSpacing.sm),
          Text(
            label,
            style: Theme.of(context).textTheme.titleSmall,
            softWrap: true,
          ),
          const SizedBox(height: CmmsSpacing.xs),
          Text(
            value?.toString() ?? '0',
            style: Theme.of(context).textTheme.headlineSmall,
            softWrap: true,
          ),
        ],
      ),
      padding: const EdgeInsets.all(CmmsSpacing.md),
    );
  }
}
