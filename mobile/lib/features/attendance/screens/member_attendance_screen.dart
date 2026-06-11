import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/church_localization.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/repositories/attendance_repository.dart';
import '../../../core/repositories/dashboard_repository.dart';
import '../../../core/widgets/event_picker.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/widgets/shell_aware_scaffold.dart';

const _excuseReasons = [
  'illness',
  'travel',
  'work_school',
  'emergency',
  'family_issue',
  'approved_leave',
  'unavoidable_conflict',
  'unknown',
];

class MemberAttendanceScreen extends ConsumerStatefulWidget {
  const MemberAttendanceScreen({super.key});

  @override
  ConsumerState<MemberAttendanceScreen> createState() =>
      _MemberAttendanceScreenState();
}

class _MemberAttendanceScreenState extends ConsumerState<MemberAttendanceScreen> {
  final _dashboardRepo = DashboardRepository();
  final _attendanceRepo = AttendanceRepository();
  Map<String, dynamic>? _summary;
  bool _loading = true;
  String? _eventId;
  String? _eventTitle;
  String _reasonType = 'illness';
  final _notes = TextEditingController();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final summary = await _dashboardRepo.memberSummary();
      _summary = summary.raw;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitExcuse() async {
    final l10n = context.l10n;
    if (_eventId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.event_picker_label)),
      );
      return;
    }

    setState(() => _submitting = true);
    final repo = AttendanceRepository(client: ref.read(apiClientProvider));
    try {
      await repo.submitSelfExcused(
        eventId: _eventId!,
        reasonType: _reasonType,
        excuseReason: _notes.text.isEmpty ? _reasonType : _notes.text,
        notes: _notes.text.isEmpty ? null : _notes.text,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              l10n.attendance_excuse_submitted(
                _eventTitle ?? l10n.term_event,
              ),
            ),
          ),
        );
        _notes.clear();
      }
      await _load();
    } catch (_) {
      final auth = ref.read(authProvider);
      final memberId = auth.profile?['member']?['id'] as String?;
      if (memberId != null) {
        await ref.read(syncServiceProvider).enqueue(
              entity: 'Attendance',
              entityId: '${_eventId}_$memberId',
              payload: {
                'eventId': _eventId,
                'memberId': memberId,
                'physicalStatus': 'ABSENT',
                'reasonCategory': 'EXCUSED',
                'operationalStatus': 'EXCUSED_ABSENCE',
                'reasonType': _reasonType,
                'excuseReason': _notes.text.isEmpty ? _reasonType : _notes.text,
              },
            );
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.attendance_queued_offline)),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final score = _summary?['attendanceScore'] as Map<String, dynamic>?;
    final recent =
        (_summary?['attendanceRecent'] as List?)?.cast<Map<String, dynamic>>() ??
            [];

    return ShellAwareScaffold(
      title: l10n.member_attendance_label,
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: _load,
          tooltip: l10n.common_refresh,
        ),
      ],
      body: _loading
          ? Center(child: Text(l10n.common_loading))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(CmmsSpacing.md),
                children: [
                  if (score != null)
                    CmmsCard(
                      title: l10n.attendance_reliability_title,
                      subtitle: l10n.attendance_reliability_subtitle(
                        score['percentage']?.toString() ?? '—',
                        score['bandLabel']?.toString() ?? '',
                      ),
                    ),
                  const SizedBox(height: CmmsSpacing.md),
                  CmmsCard(
                    title: l10n.attendance_excuse_request_title,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          l10n.attendance_excuse_request_subtitle,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: CmmsSpacing.sm),
                        EventPicker(
                          label: l10n.event_picker_label,
                          onSelected: (e) => setState(() {
                            _eventId = e['id'] as String;
                            _eventTitle = e['title'] as String?;
                          }),
                        ),
                        const SizedBox(height: CmmsSpacing.sm),
                        DropdownButtonFormField<String>(
                          value: _reasonType,
                          isExpanded: true,
                          decoration: InputDecoration(
                            labelText: l10n.attendance_excuse_reason_label,
                          ),
                          items: _excuseReasons
                              .map(
                                (r) => DropdownMenuItem(
                                  value: r,
                                  child: Text(l10n.attendanceExcuseReasonLabel(r)),
                                ),
                              )
                              .toList(),
                          onChanged: (v) =>
                              setState(() => _reasonType = v ?? 'illness'),
                        ),
                        const SizedBox(height: CmmsSpacing.sm),
                        TextField(
                          controller: _notes,
                          decoration: InputDecoration(
                            labelText: l10n.attendance_notes_label,
                          ),
                          maxLines: 3,
                        ),
                        const SizedBox(height: CmmsSpacing.md),
                        CmmsButton(
                          label: l10n.attendance_excuse_submit_action,
                          onPressed: _submitting ? null : _submitExcuse,
                          isLoading: _submitting,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: CmmsSpacing.lg),
                  Text(
                    l10n.attendance_recent_title,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: CmmsSpacing.xs),
                  if (recent.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(CmmsSpacing.md),
                      child: Text(l10n.attendance_recent_empty),
                    )
                  else
                    ...recent.map((row) {
                      final event = row['event'] as Map<String, dynamic>?;
                      final status =
                          row['operationalStatus'] as String? ?? 'ATTENDED';
                      return CmmsCard(
                        title: event?['title'] as String? ?? l10n.term_event,
                        subtitle: l10n.attendanceOperationalStatusLabel(status),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
