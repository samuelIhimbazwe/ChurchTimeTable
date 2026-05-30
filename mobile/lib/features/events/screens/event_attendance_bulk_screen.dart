import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/attendance/attendance_payload.dart';
import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/design/components/chips/attendance_status_chip.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/church_localization.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/repositories/attendance_repository.dart';

class EventAttendanceBulkScreen extends ConsumerStatefulWidget {
  const EventAttendanceBulkScreen({
    super.key,
    required this.eventId,
    required this.assignments,
  });

  final String eventId;
  final List<Map<String, dynamic>> assignments;

  @override
  ConsumerState<EventAttendanceBulkScreen> createState() =>
      _EventAttendanceBulkScreenState();
}

class _EventAttendanceBulkScreenState
    extends ConsumerState<EventAttendanceBulkScreen> {
  final Map<String, String> _statusByMember = {};

  String _operationalMark(String physical) {
    switch (physical) {
      case 'LATE':
        return 'LATE';
      case 'ABSENT':
        return 'UNEXCUSED_ABSENCE';
      default:
        return 'ATTENDED';
    }
  }
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    for (final a in widget.assignments) {
      final member = a['member'] as Map<String, dynamic>?;
      final id = member?['id'] as String? ?? a['memberId'] as String?;
      if (id != null) _statusByMember[id] = 'PRESENT';
    }
  }

  Future<void> _save() async {
    final l10n = context.l10n;
    setState(() => _saving = true);

    final records = _statusByMember.entries.map((e) {
      return AttendancePayload.forOperational(
        eventId: widget.eventId,
        memberId: e.key,
        mark: _operationalMark(e.value),
      );
    }).toList();

    final repo = AttendanceRepository(client: ref.read(apiClientProvider));
    try {
      await repo.bulkUpsert(records);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.attendance_saved_success)),
        );
        Navigator.pop(context, true);
      }
    } catch (_) {
      final sync = ref.read(syncServiceProvider);
      for (final r in records) {
        await sync.enqueue(
          entity: 'Attendance',
          entityId: '${widget.eventId}_${r['memberId']}',
          payload: r,
        );
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.attendance_queued_offline)),
        );
        Navigator.pop(context, true);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.attendance_bulk_title)),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(CmmsSpacing.md),
              itemCount: widget.assignments.length,
              itemBuilder: (_, i) {
                final a = widget.assignments[i];
                final member = a['member'] as Map<String, dynamic>?;
                final id = member?['id'] as String? ?? a['memberId'] as String;
                final name = member?['fullName'] as String? ??
                    l10n.member_name_fallback;
                final status = _statusByMember[id] ?? 'PRESENT';

                return Card(
                  margin: const EdgeInsets.only(bottom: CmmsSpacing.xs),
                  child: Padding(
                    padding: const EdgeInsets.all(CmmsSpacing.sm),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: Theme.of(context).textTheme.titleSmall),
                        const SizedBox(height: CmmsSpacing.xs),
                        Wrap(
                          spacing: CmmsSpacing.xs,
                          children: ['PRESENT', 'LATE', 'ABSENT'].map((s) {
                            return FilterChip(
                              label: Text(
                                l10n.attendancePhysicalStatusLabel(s),
                              ),
                              selected: status == s,
                              onSelected: (_) =>
                                  setState(() => _statusByMember[id] = s),
                            );
                          }).toList(),
                        ),
                        AttendanceStatusChip.fromOperational(
                          context,
                          _operationalMark(status),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(CmmsSpacing.md),
            child: CmmsButton(
              label: l10n.attendance_bulk_save,
              onPressed: _saving ? null : _save,
              isLoading: _saving,
            ),
          ),
        ],
      ),
    );
  }
}
