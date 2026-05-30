import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/attendance/attendance_payload.dart';
import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/components/chips/attendance_status_chip.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/church_localization.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/repositories/assignment_repository.dart';
import '../../../core/repositories/attendance_repository.dart';
import '../../../core/widgets/event_picker.dart';
import '../../../core/auth/governance_permissions.dart';
import '../../auth/providers/auth_provider.dart';
import 'attendance_choir_tab.dart';
import 'attendance_oversight_tab.dart';

class AttendanceGovernanceScreen extends ConsumerStatefulWidget {
  const AttendanceGovernanceScreen({super.key});

  @override
  ConsumerState<AttendanceGovernanceScreen> createState() =>
      _AttendanceGovernanceScreenState();
}

class _AttendanceGovernanceScreenState
    extends ConsumerState<AttendanceGovernanceScreen> {
  String? _eventId;
  List<Map<String, dynamic>> _assignments = [];
  List<Map<String, dynamic>> _records = [];
  Set<String>? _scopedMemberIds;
  bool _loading = false;
  bool _saving = false;

  final _marks = const [
    'ATTENDED',
    'LATE',
    'EXCUSED_ABSENCE',
    'UNEXCUSED_ABSENCE',
    'REPLACEMENT_SERVED',
    'VOLUNTARY_EXTRA_SERVICE',
  ];

  @override
  void initState() {
    super.initState();
    _loadScope();
  }

  Future<void> _loadScope() async {
    final auth = ref.read(authProvider);
    if (hasProtocolCoordination(auth.permissions) ||
        hasProtocolOversight(auth.permissions)) {
      return;
    }

    final repo = AttendanceRepository(client: ref.read(apiClientProvider));
    try {
      final summary = await repo.teamHeadSummary();
      final ids = (summary['scopedMemberIds'] as List?)
          ?.map((e) => e.toString())
          .toList();
      if (ids != null && ids.isNotEmpty) {
        setState(() => _scopedMemberIds = ids.toSet());
      }
    } catch (_) {
      // Non-team-head leaders see full roster.
    }
  }

  Future<void> _loadRoster() async {
    if (_eventId == null) return;
    setState(() => _loading = true);
    final assignmentRepo =
        AssignmentRepository(client: ref.read(apiClientProvider));
    final attendanceRepo =
        AttendanceRepository(client: ref.read(apiClientProvider));
    try {
      final assignments = await assignmentRepo.byEvent(_eventId!);
      final records = await attendanceRepo.byEvent(_eventId!);
      var visible = assignments;
      if (_scopedMemberIds != null) {
        visible = assignments.where((a) {
          final member = a['member'] as Map<String, dynamic>?;
          final id = member?['id'] as String? ?? a['memberId'] as String?;
          return id != null && _scopedMemberIds!.contains(id);
        }).toList();
      }
      setState(() {
        _assignments = visible;
        _records = records;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic>? _recordFor(String memberId) {
    for (final row in _records) {
      if (row['memberId'] == memberId) return row;
    }
    return null;
  }

  Future<void> _markMember(String memberId, String mark) async {
    if (_eventId == null) return;
    final l10n = context.l10n;
    final repo = AttendanceRepository(client: ref.read(apiClientProvider));
    final payload = AttendancePayload.forOperational(
      eventId: _eventId!,
      memberId: memberId,
      mark: mark,
    );
    try {
      await repo.upsert(payload);
      await _loadRoster();
    } catch (_) {
      await ref.read(syncServiceProvider).enqueue(
            entity: 'Attendance',
            entityId: '${_eventId}_$memberId',
            payload: payload,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.attendance_queued_offline)),
        );
      }
    }
  }

  Future<void> _markAllPresent() async {
    if (_eventId == null || _assignments.isEmpty) return;
    setState(() => _saving = true);
    final repo = AttendanceRepository(client: ref.read(apiClientProvider));
    final records = _assignments.map((a) {
      final member = a['member'] as Map<String, dynamic>?;
      final id = member?['id'] as String? ?? a['memberId'] as String;
      return AttendancePayload.forOperational(
        eventId: _eventId!,
        memberId: id,
        mark: 'ATTENDED',
      );
    }).toList();
    try {
      await repo.bulkUpsert(records);
      await _loadRoster();
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _reviewExcuse(String id, bool approve) async {
    final repo = AttendanceRepository(client: ref.read(apiClientProvider));
    await repo.reviewExcused(id, approve: approve);
    await _loadRoster();
  }

  List<Map<String, dynamic>> get _pendingExcuses => _records
      .where(
        (r) =>
            r['operationalStatus'] == 'EXCUSED_ABSENCE' &&
            r['approvedById'] == null,
      )
      .toList();

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final perms = auth.permissions;
    final canOversight =
        hasProtocolOversight(perms) || hasProtocolCoordination(perms);
    final tabCount = 2 + (canOversight ? 1 : 0);

    return DefaultTabController(
      length: tabCount,
      child: Scaffold(
        appBar: AppBar(
          title: Text(l10n.attendance_governance_title),
          actions: [
            if (_eventId != null)
              TextButton(
                onPressed: _saving ? null : _markAllPresent,
                child: Text(l10n.attendance_mark_all_present),
              ),
          ],
          bottom: TabBar(
            tabs: [
              Tab(text: l10n.attendance_tab_marking),
              Tab(text: l10n.attendance_tab_choir),
              if (canOversight) Tab(text: l10n.attendance_tab_oversight),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildMarkingTab(l10n),
            const AttendanceChoirTab(),
            if (canOversight) const AttendanceOversightTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildMarkingTab(dynamic l10n) {
    return Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(CmmsSpacing.md),
            child: EventPicker(
              label: l10n.event_picker_label,
              onSelected: (e) {
                setState(() => _eventId = e['id'] as String);
                _loadRoster();
              },
            ),
          ),
          if (_pendingExcuses.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: CmmsSpacing.md),
              child: CmmsCard(
                title: l10n.attendance_excuse_review_title,
                child: Column(
                  children: _pendingExcuses.map((row) {
                    final member = row['member'] as Map<String, dynamic>?;
                    final name = member != null
                        ? '${member['firstName']} ${member['lastName']}'
                        : l10n.member_name_fallback;
                    return ListTile(
                      title: Text(name),
                      subtitle: Text(
                        row['excuseReason'] as String? ??
                            l10n.attendance_excuse_no_reason,
                      ),
                      trailing: Wrap(
                        spacing: 4,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.check),
                            tooltip: l10n.common_approve,
                            onPressed: () =>
                                _reviewExcuse(row['id'] as String, true),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close),
                            tooltip: l10n.swap_reject_action,
                            onPressed: () =>
                                _reviewExcuse(row['id'] as String, false),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          Expanded(
            child: _eventId == null
                ? Center(child: Text(l10n.attendance_select_event_hint))
                : _loading
                    ? Center(child: Text(l10n.common_loading))
                    : _assignments.isEmpty
                        ? Center(child: Text(l10n.attendance_roster_empty))
                        : ListView.builder(
                            padding:
                                const EdgeInsets.all(CmmsSpacing.md),
                            itemCount: _assignments.length,
                            itemBuilder: (_, i) {
                              final a = _assignments[i];
                              final member =
                                  a['member'] as Map<String, dynamic>?;
                              final id = member?['id'] as String? ??
                                  a['memberId'] as String;
                              final name = member != null
                                  ? '${member['firstName']} ${member['lastName']}'
                                  : l10n.member_name_fallback;
                              final record = _recordFor(id);
                              final currentMark =
                                  record?['operationalStatus'] as String?;

                              return Card(
                                margin: const EdgeInsets.only(
                                  bottom: CmmsSpacing.xs,
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(
                                    CmmsSpacing.sm,
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        name,
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleSmall,
                                      ),
                                      if (currentMark != null) ...[
                                        const SizedBox(
                                          height: CmmsSpacing.xs,
                                        ),
                                        AttendanceStatusChip.fromOperational(
                                          context,
                                          currentMark,
                                        ),
                                      ],
                                      const SizedBox(height: CmmsSpacing.xs),
                                      Wrap(
                                        spacing: 4,
                                        runSpacing: 4,
                                        children: _marks.map((mark) {
                                          return ActionChip(
                                            label: Text(
                                              l10n
                                                  .attendanceOperationalStatusLabel(
                                                mark,
                                              ),
                                              style: const TextStyle(
                                                fontSize: 11,
                                              ),
                                            ),
                                            onPressed: () =>
                                                _markMember(id, mark),
                                          );
                                        }).toList(),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        ],
    );
  }
}
