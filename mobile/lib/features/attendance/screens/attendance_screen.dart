import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/design/components/chips/attendance_status_chip.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/widgets/event_picker.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/localization/locale_provider.dart';

class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  String? _eventId;
  String _status = 'PRESENT';
  final _notes = TextEditingController();

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    final auth = ref.read(authProvider);
    final api = ref.read(apiClientProvider);
    final memberId = auth.profile?['member']?['id'] as String?;
    if (memberId == null || _eventId == null) return;

    final payload = {
      'eventId': _eventId,
      'memberId': memberId,
      'physicalStatus': _status,
      'notes': _notes.text,
    };

    try {
      await api.loadToken();
      await api.dio.put('/attendance', data: payload);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _eventId != null
                  ? l10n.attendance_marked_for_event(_eventId!)
                  : l10n.attendance_saved_success,
            ),
          ),
        );
      }
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

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.member_attendance_label)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            EventPicker(
              label: l10n.event_picker_label,
              onSelected: (e) => setState(() => _eventId = e['id'] as String),
            ),
            const SizedBox(height: CmmsSpacing.md),
            Wrap(
              spacing: CmmsSpacing.xs,
              runSpacing: CmmsSpacing.xs,
              children: [
                AttendanceStatusChip.fromPhysical(context, 'PRESENT'),
                AttendanceStatusChip.fromPhysical(context, 'ABSENT'),
                AttendanceStatusChip.fromPhysical(context, 'LATE'),
                AttendanceStatusChip.fromPhysical(
                  context,
                  'ABSENT',
                  reasonCategory: 'EXCUSED',
                ),
              ],
            ),
            const SizedBox(height: CmmsSpacing.sm),
            DropdownButtonFormField<String>(
              value: _status,
              isExpanded: true,
              decoration:
                  InputDecoration(labelText: l10n.member_attendance_label),
              items: [
                DropdownMenuItem(
                  value: 'PRESENT',
                  child: Text(l10n.attendancePhysicalStatusLabel('PRESENT')),
                ),
                DropdownMenuItem(
                  value: 'ABSENT',
                  child: Text(l10n.attendancePhysicalStatusLabel('ABSENT')),
                ),
                DropdownMenuItem(
                  value: 'LATE',
                  child: Text(l10n.attendancePhysicalStatusLabel('LATE')),
                ),
              ],
              onChanged: (v) => setState(() => _status = v ?? 'PRESENT'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _notes,
              decoration: InputDecoration(labelText: l10n.attendance_notes_label),
              maxLines: 3,
            ),
            const Spacer(),
            CmmsButton(
              label: l10n.attendance_save_action,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}
