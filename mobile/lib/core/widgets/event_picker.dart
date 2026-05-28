import 'package:flutter/material.dart';
import '../localization/l10n.dart';
import '../repositories/event_repository.dart';

class EventPicker extends StatefulWidget {
  const EventPicker({
    super.key,
    required this.onSelected,
    this.label,
  });

  final ValueChanged<Map<String, dynamic>> onSelected;
  final String? label;

  @override
  State<EventPicker> createState() => _EventPickerState();
}

class _EventPickerState extends State<EventPicker> {
  final _repo = EventRepository();
  List<Map<String, dynamic>> _events = [];
  Map<String, dynamic>? _selected;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      _events = await _repo.list();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const LinearProgressIndicator();
    }

    return DropdownButtonFormField<Map<String, dynamic>>(
      decoration: InputDecoration(
        labelText: widget.label ?? context.l10n.event_picker_label,
      ),
      value: _selected,
      items: _events
          .map(
            (e) => DropdownMenuItem(
              value: e,
              child: Text(
                '${e['title']} (${e['type']})',
                overflow: TextOverflow.ellipsis,
              ),
            ),
          )
          .toList(),
      onChanged: (v) {
        setState(() => _selected = v);
        if (v != null) widget.onSelected(v);
      },
    );
  }
}
