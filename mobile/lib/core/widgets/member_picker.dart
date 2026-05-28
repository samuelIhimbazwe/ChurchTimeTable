import 'package:flutter/material.dart';
import '../localization/l10n.dart';
import '../repositories/member_repository.dart';

class MemberPicker extends StatefulWidget {
  const MemberPicker({
    super.key,
    required this.onSelected,
    this.label,
  });

  final ValueChanged<Map<String, dynamic>> onSelected;
  final String? label;

  @override
  State<MemberPicker> createState() => _MemberPickerState();
}

class _MemberPickerState extends State<MemberPicker> {
  final _repo = MemberRepository();
  List<Map<String, dynamic>> _members = [];
  Map<String, dynamic>? _selected;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      _members = await _repo.list();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _label(Map<String, dynamic> m) =>
      '${m['firstName']} ${m['lastName']} (${m['ministry']})';

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const LinearProgressIndicator();
    }

    return DropdownButtonFormField<Map<String, dynamic>>(
      decoration: InputDecoration(
        labelText: widget.label ?? context.l10n.member_picker_label,
      ),
      value: _selected,
      items: _members
          .map(
            (m) => DropdownMenuItem(
              value: m,
              child: Text(_label(m), overflow: TextOverflow.ellipsis),
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
