import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/api_error_localizer.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/repositories/event_repository.dart';
import '../../../core/localization/locale_provider.dart';
import '../providers/event_providers.dart';

class EventCreateScreen extends ConsumerStatefulWidget {
  const EventCreateScreen({super.key});

  @override
  ConsumerState<EventCreateScreen> createState() => _EventCreateScreenState();
}

class _EventCreateScreenState extends ConsumerState<EventCreateScreen> {
  final _title = TextEditingController();
  final _location = TextEditingController();
  final _description = TextEditingController();
  String _type = 'CHOIR_SERVICE';
  String _ministry = 'CHOIR';
  String? _recurrence;
  DateTime _start = DateTime.now().add(const Duration(days: 1));
  DateTime _end = DateTime.now().add(const Duration(days: 1, hours: 2));
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _title.dispose();
    _location.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l10n = context.l10n;
    if (_title.text.trim().isEmpty) {
      setState(() => _error = l10n.error_validation);
      return;
    }
    if (_end.isBefore(_start)) {
      setState(() => _error = l10n.event_conflict_error);
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    final repo = EventRepository(client: ref.read(apiClientProvider));
    try {
      await repo.create({
        'title': _title.text.trim(),
        'type': _type,
        'ministryScope': _ministry,
        'startTime': _start.toUtc().toIso8601String(),
        'endTime': _end.toUtc().toIso8601String(),
        'location': _location.text.trim().isEmpty ? null : _location.text.trim(),
        'description':
            _description.text.trim().isEmpty ? null : _description.text.trim(),
        if (_recurrence != null) 'recurrenceRule': _recurrence,
        'status': 'SCHEDULED',
      });
      ref.invalidate(eventsListProvider(const EventListFilter()));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.event_created_success)),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      setState(() {
        _error = ApiErrorLocalizer.resolve(
          l10n,
          serverMessage: e.toString(),
          code: null,
        );
        _saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.event_create_title)),
      body: ListView(
        padding: const EdgeInsets.all(CmmsSpacing.md),
        children: [
          TextField(
            controller: _title,
            decoration: InputDecoration(labelText: l10n.term_event),
          ),
          const SizedBox(height: CmmsSpacing.sm),
          DropdownButtonFormField<String>(
            value: _type,
            isExpanded: true,
            decoration: InputDecoration(labelText: l10n.term_schedule),
            items: [
              'CHOIR_SERVICE',
              'REHEARSAL',
              'CONCERT',
              'PROTOCOL_SERVICE',
              'CHURCH_EVENT',
            ]
                .map(
                  (t) => DropdownMenuItem(
                    value: t,
                    child: Text(l10n.eventTypeLabel(t)),
                  ),
                )
                .toList(),
            onChanged: (v) => setState(() => _type = v ?? _type),
          ),
          const SizedBox(height: CmmsSpacing.sm),
          DropdownButtonFormField<String>(
            value: _ministry,
            isExpanded: true,
            decoration: InputDecoration(labelText: l10n.term_committee),
            items: ['CHOIR', 'PROTOCOL', 'BOTH']
                .map(
                  (m) => DropdownMenuItem(
                    value: m,
                    child: Text(l10n.ministryScopeLabel(m)),
                  ),
                )
                .toList(),
            onChanged: (v) => setState(() => _ministry = v ?? _ministry),
          ),
          const SizedBox(height: CmmsSpacing.sm),
          ListTile(
            title: Text(l10n.event_start_label),
            subtitle: Text(_start.toLocal().toString()),
            onTap: () async {
              final d = await showDatePicker(
                context: context,
                initialDate: _start,
                firstDate: DateTime(2024),
                lastDate: DateTime(2030),
              );
              if (d == null || !mounted) return;
              final t = await showTimePicker(
                context: context,
                initialTime: TimeOfDay.fromDateTime(_start),
              );
              if (t == null) return;
              setState(() {
                _start = DateTime(d.year, d.month, d.day, t.hour, t.minute);
                if (_end.isBefore(_start)) {
                  _end = _start.add(const Duration(hours: 2));
                }
              });
            },
          ),
          ListTile(
            title: Text(l10n.event_end_label),
            subtitle: Text(_end.toLocal().toString()),
            onTap: () async {
              final d = await showDatePicker(
                context: context,
                initialDate: _end,
                firstDate: DateTime(2024),
                lastDate: DateTime(2030),
              );
              if (d == null || !mounted) return;
              final t = await showTimePicker(
                context: context,
                initialTime: TimeOfDay.fromDateTime(_end),
              );
              if (t == null) return;
              setState(() {
                _end = DateTime(d.year, d.month, d.day, t.hour, t.minute);
              });
            },
          ),
          TextField(
            controller: _location,
            decoration: InputDecoration(labelText: l10n.event_location_label),
          ),
          TextField(
            controller: _description,
            decoration:
                InputDecoration(labelText: l10n.event_description_label),
            maxLines: 3,
          ),
          DropdownButtonFormField<String>(
            value: _recurrence,
            isExpanded: true,
            decoration: InputDecoration(labelText: l10n.event_recurrence_label),
            items: [
              DropdownMenuItem(child: Text(l10n.event_filter_all_types)),
              const DropdownMenuItem(value: 'WEEKLY', child: Text('WEEKLY')),
              const DropdownMenuItem(value: 'BIWEEKLY', child: Text('BIWEEKLY')),
            ],
            onChanged: (v) => setState(() => _recurrence = v),
          ),
          if (_error != null) ...[
            const SizedBox(height: CmmsSpacing.sm),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
              softWrap: true,
            ),
          ],
          const SizedBox(height: CmmsSpacing.lg),
          CmmsButton(
            label: l10n.common_create,
            onPressed: _saving ? null : _save,
            isLoading: _saving,
          ),
        ],
      ),
    );
  }
}
