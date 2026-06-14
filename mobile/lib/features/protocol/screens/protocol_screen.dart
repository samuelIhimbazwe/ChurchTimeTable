import 'package:flutter/material.dart';

import '../../../core/routing/app_router.dart';
import '../protocol_cache.dart';
import '../protocol_repository.dart';

class ProtocolScreen extends StatefulWidget {
  const ProtocolScreen({super.key});

  @override
  State<ProtocolScreen> createState() => _ProtocolScreenState();
}

class _ProtocolScreenState extends State<ProtocolScreen> {
  final _cache = ProtocolCache();
  final _repo = ProtocolRepository();
  Map<String, dynamic>? _dashboard;
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
      final dash = await _repo.getDashboard();
      final history = await _repo.getAttendanceHistory();
      final assignments = (dash?['assignments'] as List<dynamic>?) ?? [];
      await _cache.saveDashboard(dash ?? {});
      await _cache.saveAssignments(assignments);
      setState(() {
        _dashboard = dash;
        _history = history;
        _loading = false;
      });
    } catch (_) {
      setState(() {
        _dashboard = null;
        _history = [];
        _loading = false;
      });
      final cachedDash = await _cache.loadDashboard();
      final cachedAssign = await _cache.loadAssignments();
      if (cachedDash != null || cachedAssign != null) {
        setState(() {
          _dashboard = cachedDash;
        });
      }
    }
  }

  void _openAssignmentDetail(Map<String, dynamic> assignment) {
    final team = assignment['team'] as Map<String, dynamic>?;
    final occurrence = team?['occurrence'] as Map<String, dynamic>?;
    final attendance = assignment['attendance'] as Map<String, dynamic>?;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              occurrence?['title'] ?? 'Service',
              style: Theme.of(ctx).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text('Start: ${occurrence?['startAt'] ?? '—'}'),
            Text('Team status: ${team?['status'] ?? '—'}'),
            Text(
              'Attendance: ${attendance?['outcome'] ?? 'Not recorded'}',
            ),
            if (attendance?['notes'] != null)
              Text('Note: ${attendance!['notes']}'),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = _dashboard?['profile'] as Map<String, dynamic>?;
    final assignments =
        (_dashboard?['assignments'] as List<dynamic>?) ?? [];
    final quota = _dashboard?['quota'] as Map<String, dynamic>?;

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
                  if (quota != null)
                    Text(
                      'Quota: ${quota['status'] ?? '—'} (${quota['officialServicesMonth'] ?? 0} official)',
                    ),
                  const SizedBox(height: 16),
                ],
                ListTile(
                  leading: const Icon(Icons.payments_outlined),
                  title: const Text('Submit contribution'),
                  subtitle: const Text('Direct to protocol treasurer'),
                  onTap: () => Navigator.pushNamed(
                    context,
                    AppRouter.protocolContribute,
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.account_balance_wallet_outlined),
                  title: const Text('Treasury overview'),
                  subtitle: const Text('Read-only contribution list'),
                  onTap: () => Navigator.pushNamed(
                    context,
                    AppRouter.protocolTreasury,
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.swap_horiz_outlined),
                  title: const Text('Request replacement'),
                  subtitle: const Text('Cannot attend — nominate a cover'),
                  onTap: () => Navigator.pushNamed(
                    context,
                    AppRouter.protocolReplacement,
                  ),
                ),
                const Divider(),
                Text(
                  'My assignments',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                if (assignments.isEmpty)
                  const ListTile(
                    title: Text('No published assignments'),
                    subtitle: Text('Teams appear after coordinator publish'),
                  ),
                ...assignments.map(
                  (a) {
                    final row = Map<String, dynamic>.from(a as Map);
                    final team = row['team'] as Map<String, dynamic>?;
                    final occurrence =
                        team?['occurrence'] as Map<String, dynamic>?;
                    final attendance = row['attendance'] as Map<String, dynamic>?;
                    return ListTile(
                      title: Text(
                        '${occurrence?['title'] ?? 'Service'}',
                      ),
                      subtitle: Text(
                        attendance != null
                            ? 'Recorded: ${attendance['outcome']}'
                            : 'Pending attendance',
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => _openAssignmentDetail(row),
                    );
                  },
                ),
                const Divider(),
                Text(
                  'Attendance history',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                ..._history.take(10).map(
                  (h) {
                    final row = Map<String, dynamic>.from(h as Map);
                    final team = row['team'] as Map<String, dynamic>?;
                    final occurrence =
                        team?['occurrence'] as Map<String, dynamic>?;
                    final attendance =
                        row['attendance'] as Map<String, dynamic>?;
                    return ListTile(
                      dense: true,
                      title: Text(
                        '${occurrence?['title'] ?? ''}',
                      ),
                      subtitle: Text('${attendance?['outcome'] ?? '—'}'),
                    );
                  },
                ),
              ],
            ),
    );
  }
}
