import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../core/widgets/event_picker.dart';
import '../../../core/widgets/member_picker.dart';
import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/widgets/overflow_safe_button.dart';
import '../widgets/member_availability_panel.dart';

class LeaderAssignmentScreen extends ConsumerStatefulWidget {
  const LeaderAssignmentScreen({super.key});

  @override
  ConsumerState<LeaderAssignmentScreen> createState() =>
      _LeaderAssignmentScreenState();
}

class _LeaderAssignmentScreenState
    extends ConsumerState<LeaderAssignmentScreen> {
  String? _eventId;
  final List<String> _memberIds = [];
  String? _lastPickedMemberId;
  bool _override = false;
  String? _validateMessage;
  final _overrideReason = TextEditingController();

  @override
  void dispose() {
    _overrideReason.dispose();
    super.dispose();
  }

  Future<void> _validateFirst() async {
    if (_eventId == null || _memberIds.isEmpty) return;
    final l10n = context.l10n;
    final api = ref.read(apiClientProvider);
    await api.loadToken();
    final res = await api.dio.post('/assignments/validate', data: {
      'eventId': _eventId,
      'memberId': _memberIds.first,
      'isOverride': _override,
      if (_override) 'overrideReason': _overrideReason.text,
    });
    final data = res.data['data'] as Map<String, dynamic>? ?? {};
    setState(() {
      _validateMessage = data['valid'] == true
          ? null
          : (data['message'] as String? ?? l10n.assignment_conflict_warning);
    });
  }

  Future<void> _bulkAssign() async {
    if (_eventId == null || _memberIds.isEmpty) return;
    final l10n = context.l10n;
    final api = ref.read(apiClientProvider);
    await api.loadToken();
    await api.dio.post('/assignments/bulk', data: {
      'assignments': _memberIds
          .map(
            (id) => {
              'eventId': _eventId,
              'memberId': id,
              'isOverride': _override,
              if (_override) 'overrideReason': _overrideReason.text,
            },
          )
          .toList(),
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            l10n.assignment_members_assigned_message(_memberIds.length),
          ),
        ),
      );
      setState(() => _memberIds.clear());
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.assignments_title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          EventPicker(
            onSelected: (e) => setState(() => _eventId = e['id'] as String),
          ),
          const SizedBox(height: 16),
          MemberPicker(
            label: l10n.assignment_add_member_label,
            onSelected: (m) {
              final id = m['id'] as String;
              if (!_memberIds.contains(id)) {
                setState(() {
                  _memberIds.add(id);
                  _lastPickedMemberId = id;
                  _validateMessage = null;
                });
              }
            },
          ),
          if (_lastPickedMemberId != null && _eventId != null)
            MemberAvailabilityPanel(
              memberId: _lastPickedMemberId!,
              eventId: _eventId,
            ),
          if (_validateMessage != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                _validateMessage!,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                ),
                softWrap: true,
              ),
            ),
          CmmsButton(
            label: l10n.assignment_validate_action,
            variant: CmmsButtonVariant.secondary,
            onPressed:
                _eventId != null && _memberIds.isNotEmpty ? _validateFirst : null,
          ),
          const SizedBox(height: 8),
          SwitchListTile(
            title: Text(
              l10n.assignment_manual_override_label,
              softWrap: true,
            ),
            value: _override,
            onChanged: (v) => setState(() => _override = v),
          ),
          if (_override)
            TextField(
              controller: _overrideReason,
              decoration: InputDecoration(
                labelText: l10n.assignment_override_reason_label,
              ),
            ),
          const SizedBox(height: 8),
          Text(
            l10n.assignment_queue_title(_memberIds.length),
            style: Theme.of(context).textTheme.titleSmall,
          ),
          ..._memberIds.map(
            (id) => ListTile(
              title: Text(id, softWrap: true),
              trailing: IconButton(
                icon: const Icon(Icons.remove_circle_outline),
                onPressed: () => setState(() => _memberIds.remove(id)),
              ),
            ),
          ),
          const SizedBox(height: 16),
          OverflowSafeButton(
            label: l10n.assignment_bulk_assign_action,
            onPressed:
                _eventId != null && _memberIds.isNotEmpty ? _bulkAssign : null,
          ),
        ],
      ),
    );
  }
}
