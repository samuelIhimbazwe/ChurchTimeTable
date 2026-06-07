import 'package:flutter/material.dart';

import '../../../core/api/api_client.dart';
import '../protocol_cache.dart';

class ProtocolScreen extends StatefulWidget {
  const ProtocolScreen({super.key});

  @override
  State<ProtocolScreen> createState() => _ProtocolScreenState();
}

class _ProtocolScreenState extends State<ProtocolScreen> {
  final _cache = ProtocolCache();
  Map<String, dynamic>? _dashboard;
  List<dynamic> _assignments = [];
  List<dynamic> _history = [];
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
      final dashRes = await client.get('/protocol/dashboard/me');
      final historyRes = await client.get('/protocol/attendance/history');
      final dash = dashRes.data['data'] as Map<String, dynamic>?;
      final assignments =
          (dash?['assignments'] as List<dynamic>?) ?? [];
      final history = historyRes.data['data'] as List<dynamic>? ?? [];
      await _cache.saveDashboard(dash ?? {});
      await _cache.saveAssignments(assignments);
      setState(() {
        _dashboard = dash;
        _assignments = assignments;
        _history = history;
        _loading = false;
      });
    } catch (_) {
      setState(() {
        _dashboard = null;
        _assignments = [];
        _history = [];
        _loading = false;
      });
      final cachedDash = await _cache.loadDashboard();
      final cachedAssign = await _cache.loadAssignments();
      if (cachedDash != null || cachedAssign != null) {
        setState(() {
          _dashboard = cachedDash;
          _assignments = cachedAssign ?? [];
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = _dashboard?['profile'] as Map<String, dynamic>?;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Protocol'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (profile != null) ...[
                  Text(
                    'Rank: ${profile['currentRank'] ?? '—'}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text(
                    'Services this month: ${profile['totalServicesMonth'] ?? 0}',
                  ),
                  Text(
                    'Reliability: ${profile['reliabilityScore'] ?? 100}',
                  ),
                  const SizedBox(height: 16),
                ],
                Text(
                  'My assignments',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                ..._assignments.map(
                  (a) => ListTile(
                    title: Text(
                      '${a['team']?['occurrence']?['title'] ?? 'Service'}',
                    ),
                    subtitle: Text(
                      a['attendance'] != null
                          ? 'Recorded: ${a['attendance']['outcome']}'
                          : 'Pending attendance',
                    ),
                  ),
                ),
                const Divider(),
                Text(
                  'Attendance history',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                ..._history.take(10).map(
                  (h) => ListTile(
                    dense: true,
                    title: Text(
                      '${h['team']?['occurrence']?['title'] ?? ''}',
                    ),
                    subtitle: Text('${h['attendance']?['outcome'] ?? '—'}'),
                  ),
                ),
              ],
            ),
    );
  }
}
