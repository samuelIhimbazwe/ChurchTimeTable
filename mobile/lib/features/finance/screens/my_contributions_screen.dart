import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_response.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../auth/providers/auth_provider.dart';

class MyContributionsScreen extends ConsumerStatefulWidget {
  const MyContributionsScreen({super.key});

  @override
  ConsumerState<MyContributionsScreen> createState() =>
      _MyContributionsScreenState();
}

class _MyContributionsScreenState extends ConsumerState<MyContributionsScreen> {
  Map<String, dynamic>? _payload;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _error = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final res = await api.dio.get('/finance/my-contributions');
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      if (!parsed.success || parsed.data == null) {
        setState(() => _error = parsed.error?.message ?? 'Load failed');
        return;
      }
      setState(() => _payload = parsed.data);
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  String _formatAmount(dynamic value) {
    final amount = value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
    return '${amount.toStringAsFixed(0)} RWF';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.my_contributions_title),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
        ],
      ),
      body: _error != null
          ? Center(child: Text(_error!))
          : _payload == null
              ? Center(child: Text(l10n.common_loading))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(CmmsSpacing.md),
                    children: [
                      if (_payload!['memberNumber'] != null)
                        Text(
                          '${l10n.my_contributions_member_number}: ${_payload!['memberNumber']}',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                      const SizedBox(height: CmmsSpacing.md),
                      _SummaryCards(summary: _payload!['summary'] as Map?),
                      const SizedBox(height: CmmsSpacing.md),
                      CmmsCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.my_contributions_history_title,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: CmmsSpacing.sm),
                            ..._historyItems(_payload!).map(
                              (item) => ListTile(
                                contentPadding: EdgeInsets.zero,
                                title: Text(
                                  item['referenceNumber']?.toString() ??
                                      item['contributionType']?.toString() ??
                                      '—',
                                ),
                                subtitle: Text(
                                  '${item['date']} · ${item['contributionType']} · ${item['status']}',
                                ),
                                trailing: Text(_formatAmount(item['amount'])),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  List<Map<String, dynamic>> _historyItems(Map<String, dynamic> payload) {
    final history = payload['history'] as List?;
    if (history == null) return const [];
    return history
        .map((entry) => Map<String, dynamic>.from(entry as Map))
        .take(30)
        .toList();
  }
}

class _SummaryCards extends StatelessWidget {
  const _SummaryCards({required this.summary});

  final Map<dynamic, dynamic>? summary;

  @override
  Widget build(BuildContext context) {
    if (summary == null) return const SizedBox.shrink();
    final l10n = context.l10n;
    final contributed = summary!['totalContributed'];
    final outstanding = summary!['outstandingBalance'];

    return GridView.extent(
      maxCrossAxisExtent: 260,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: CmmsSpacing.sm,
      crossAxisSpacing: CmmsSpacing.sm,
      childAspectRatio: 2.2,
      children: [
        CmmsCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(l10n.my_contributions_total),
              Text(
                '${contributed ?? 0} RWF',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ),
        ),
        CmmsCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(l10n.my_contributions_outstanding),
              Text(
                '${outstanding ?? 0} RWF',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
