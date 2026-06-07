import 'package:flutter/material.dart';

import '../../../core/api/api_client.dart';
import '../operations_cache.dart';

class OperationsScreen extends StatefulWidget {
  const OperationsScreen({super.key});

  @override
  State<OperationsScreen> createState() => _OperationsScreenState();
}

class _OperationsScreenState extends State<OperationsScreen> {
  final _cache = OperationsCache();
  List<dynamic> _assignments = [];
  Map<String, dynamic>? _dashboard;
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
      final dashRes = await client.get('/operations/dashboard');
      final assignRes = await client.get('/operations/my-assignments');
      final dash = dashRes.data['data'] as Map<String, dynamic>?;
      final assignments = assignRes.data['data'] as List<dynamic>? ?? [];
      await _cache.saveDashboard(dash ?? {});
      await _cache.saveAssignments(assignments);
      setState(() {
        _dashboard = dash;
        _assignments = assignments;
        _loading = false;
      });
    } catch (_) {
      final dash = await _cache.loadDashboard();
      final assignments = await _cache.loadAssignments() ?? [];
      setState(() {
        _dashboard = dash;
        _assignments = assignments;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My assignments'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_dashboard != null)
                  Text(
                    'Pending confirmations: ${_dashboard!['pendingConfirmations'] ?? 0}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                const SizedBox(height: 16),
                ..._assignments.map(
                  (a) => ListTile(
                    title: Text('${a['occurrence']?['title'] ?? 'Operation'}'),
                    subtitle: Text(
                      '${a['operationalUnit']?['name'] ?? ''} — ${a['status']}',
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
