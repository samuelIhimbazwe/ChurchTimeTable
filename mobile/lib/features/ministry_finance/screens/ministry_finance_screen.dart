import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import 'ministry_finance_cache.dart';

class MinistryFinanceScreen extends StatefulWidget {
  const MinistryFinanceScreen({super.key, required this.ministryId});

  final String ministryId;

  @override
  State<MinistryFinanceScreen> createState() => _MinistryFinanceScreenState();
}

class _MinistryFinanceScreenState extends State<MinistryFinanceScreen> {
  final _cache = MinistryFinanceCache();
  Map<String, dynamic>? _summary;
  List<dynamic> _funds = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final client = ApiClient();
      final summaryRes =
          await client.get('/ministries/${widget.ministryId}/finance/summary');
      final fundsRes =
          await client.get('/ministries/${widget.ministryId}/finance/funds');
      final summary = summaryRes.data['data'] as Map<String, dynamic>?;
      final funds = fundsRes.data['data'] as List<dynamic>? ?? [];
      await _cache.saveSummary(widget.ministryId, summary ?? {});
      await _cache.saveFunds(widget.ministryId, funds);
      setState(() {
        _summary = summary;
        _funds = funds;
        _loading = false;
      });
    } catch (_) {
      final summary = await _cache.loadSummary(widget.ministryId);
      final funds = await _cache.loadFunds(widget.ministryId);
      setState(() {
        _summary = summary;
        _funds = funds;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ministry finance')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Total balance: ${_summary?['totalFundBalance'] ?? 0}',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 16),
                const Text('Funds', style: TextStyle(fontWeight: FontWeight.bold)),
                ..._funds.map(
                  (f) => ListTile(
                    title: Text('${f['name']}'),
                    subtitle: Text('Balance: ${f['balance'] ?? 0}'),
                  ),
                ),
              ],
            ),
    );
  }
}
