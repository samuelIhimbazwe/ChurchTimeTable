import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/governance_permissions.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';

class RehearsalDetailScreen extends ConsumerStatefulWidget {
  const RehearsalDetailScreen({
    super.key,
    required this.eventId,
    required this.eventTitle,
  });

  final String eventId;
  final String eventTitle;

  @override
  ConsumerState<RehearsalDetailScreen> createState() => _RehearsalDetailScreenState();
}

class _RehearsalDetailScreenState extends ConsumerState<RehearsalDetailScreen>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _plan;
  List<Map<String, dynamic>> _attendance = const [];
  List<Map<String, dynamic>> _readiness = const [];
  final _memberIdController = TextEditingController();
  String _status = 'PRESENT';
  bool _loading = true;
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _memberIdController.dispose();
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final repo = ref.read(choirRepositoryProvider);
      final plan = await repo.fetchRehearsalPlan(widget.eventId);
      List<Map<String, dynamic>> attendance = const [];
      try {
        attendance = await repo.fetchRehearsalAttendance(widget.eventId);
      } catch (_) {}
      final readiness = await repo.fetchSectionReadiness();
      setState(() {
        _plan = plan;
        _attendance = attendance;
        _readiness = readiness;
        _loading = false;
      });
    } catch (_) {
      final plan = await ref.read(choirRepositoryProvider).fetchRehearsalPlan(
            widget.eventId,
            offlineFallback: true,
          );
      setState(() {
        _plan = plan.isNotEmpty ? plan : null;
        _loading = false;
      });
    }
  }

  Future<void> _markAttendance() async {
    final memberId = _memberIdController.text.trim();
    if (memberId.isEmpty) return;
    final api = ref.read(apiClientProvider);
    await api.loadToken();
    await ref.read(choirRepositoryProvider).recordRehearsalAttendance(
          widget.eventId,
          [
            {'memberId': memberId, 'status': _status},
          ],
        );
    _memberIdController.clear();
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final canManage = canManageRehearsals(
      ref.watch(authProvider).permissions,
    );
    final readiness = (_plan?['readiness'] as Map<String, dynamic>?)?['overall'] ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.eventTitle),
        bottom: TabBar(
          controller: _tabs,
          tabs: [
            Tab(text: l10n.rehearsals_plan),
            Tab(text: l10n.rehearsals_attendance),
            Tab(text: l10n.rehearsals_readiness),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                ListTile(
                  title: Text(l10n.rehearsals_prep_score),
                  trailing: Text('$readiness%'),
                ),
                Expanded(
                  child: TabBarView(
                    controller: _tabs,
                    children: [
                      _planTab(l10n),
                      _attendanceTab(l10n, canManage),
                      _readinessTab(l10n),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _planTab(dynamic l10n) {
    final songs = (_plan?['songs'] as List? ?? const [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
    return ListView(
      padding: const EdgeInsets.all(Spacing.md),
      children: [
        Text(_plan?['objectives']?.toString() ?? ''),
        const SizedBox(height: Spacing.sm),
        Text(_plan?['notes']?.toString() ?? ''),
        const Divider(),
        ...songs.map(
          (s) => ListTile(
            title: Text((s['song'] as Map?)?['title']?.toString() ?? s['songId']?.toString() ?? ''),
          ),
        ),
      ],
    );
  }

  Widget _attendanceTab(dynamic l10n, bool canManage) {
    return ListView(
      padding: const EdgeInsets.all(Spacing.md),
      children: [
        if (canManage) ...[
          TextField(
            controller: _memberIdController,
            decoration: InputDecoration(labelText: l10n.welfare_field_member_id),
          ),
          DropdownButton<String>(
            value: _status,
            items: const [
              DropdownMenuItem(value: 'PRESENT', child: Text('PRESENT')),
              DropdownMenuItem(value: 'LATE', child: Text('LATE')),
              DropdownMenuItem(value: 'EXCUSED', child: Text('EXCUSED')),
              DropdownMenuItem(value: 'ABSENT', child: Text('ABSENT')),
            ],
            onChanged: (v) => setState(() => _status = v ?? 'PRESENT'),
          ),
          FilledButton(onPressed: _markAttendance, child: Text(l10n.rehearsals_attendance)),
          const Divider(),
        ],
        ..._attendance.map((row) {
          final member = row['member'] as Map<String, dynamic>? ?? {};
          return ListTile(
            title: Text('${member['firstName'] ?? ''} ${member['lastName'] ?? ''}'),
            trailing: Text(row['status']?.toString() ?? ''),
          );
        }),
      ],
    );
  }

  Widget _readinessTab(dynamic l10n) {
    return ListView.builder(
      itemCount: _readiness.length,
      itemBuilder: (_, i) {
        final row = _readiness[i];
        return ListTile(
          title: Text(row['name']?.toString() ?? ''),
          trailing: Text('${row['readiness'] ?? 0}%'),
        );
      },
    );
  }
}
