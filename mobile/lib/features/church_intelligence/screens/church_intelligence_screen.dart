import 'package:flutter/material.dart';

import '../../../core/api/api_client.dart';
import '../church_intelligence_cache.dart';

class ChurchIntelligenceScreen extends StatefulWidget {
  const ChurchIntelligenceScreen({super.key});

  @override
  State<ChurchIntelligenceScreen> createState() =>
      _ChurchIntelligenceScreenState();
}

class _ChurchIntelligenceScreenState extends State<ChurchIntelligenceScreen> {
  final _cache = ChurchIntelligenceCache();
  Map<String, dynamic>? _summary;
  List<dynamic>? _alerts;
  List<dynamic>? _reports;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final client = ApiClient();
      final summaryRes = await client.get('/church/intelligence/summary');
      final alertsRes = await client.get('/church/intelligence/alerts');
      final reportsRes = await client.get('/church/intelligence/reports');
      final summary = summaryRes.data['data'] as Map<String, dynamic>?;
      final alerts = alertsRes.data['data'] as List<dynamic>? ?? [];
      final reports = reportsRes.data['data'] as List<dynamic>? ?? [];
      await _cache.saveSummary(summary ?? {});
      await _cache.saveAlerts(alerts);
      await _cache.saveReports(reports);
      if (!mounted) return;
      setState(() {
        _summary = summary;
        _alerts = alerts;
        _reports = reports;
        _loading = false;
      });
    } catch (_) {
      final summary = await _cache.loadSummary();
      final alerts = await _cache.loadAlerts();
      final reports = await _cache.loadReports();
      if (!mounted) return;
      setState(() {
        _summary = summary;
        _alerts = alerts;
        _reports = reports;
        _error = summary == null ? 'Unable to load church intelligence' : null;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Church intelligence'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_error != null)
                  Text(_error!, style: const TextStyle(color: Colors.red)),
                if (_summary != null) ...[
                  Text(
                    'Ministries: ${_summary!['ministryCount']} (${_summary!['activeMinistryCount']} active)',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text('Active members: ${_summary!['activeMembers']}'),
                  Text('Meetings (30d): ${_summary!['meetingsLast30Days']}'),
                  const SizedBox(height: 16),
                ],
                Text('Alerts', style: Theme.of(context).textTheme.titleSmall),
                ...?_alerts?.take(5).map(
                      (a) => ListTile(
                        title: Text('${a['title']}'),
                        subtitle: Text('${a['message']}'),
                      ),
                    ),
                const SizedBox(height: 16),
                Text('Reports', style: Theme.of(context).textTheme.titleSmall),
                ...?_reports?.map(
                      (r) => ListTile(
                        title: Text('${r['title']}'),
                        subtitle: Text('${r['formats']}'),
                      ),
                    ),
              ],
            ),
    );
  }
}
