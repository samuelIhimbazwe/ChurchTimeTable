import 'package:flutter/material.dart';

import '../protocol_repository.dart';
import '../protocol_repository.dart';

class ProtocolReplacementScreen extends StatefulWidget {
  const ProtocolReplacementScreen({super.key});

  @override
  State<ProtocolReplacementScreen> createState() =>
      _ProtocolReplacementScreenState();
}

class _ProtocolReplacementScreenState extends State<ProtocolReplacementScreen> {
  final _repo = ProtocolRepository();
  Map<String, dynamic>? _dashboard;
  List<Map<String, dynamic>> _members = [];
  String? _teamMemberId;
  String? _replacementMemberId;
  String _reason = '';
  bool _loading = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final dash = await _repo.getDashboard();
      final members = await _repo.listMembers();
      setState(() {
        _dashboard = dash;
        _members = members;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _assignments {
    final raw = _dashboard?['assignments'] as List<dynamic>? ?? [];
    return raw.map((a) => Map<String, dynamic>.from(a as Map)).toList();
  }

  String _memberLabel(Map<String, dynamic>? member) {
    if (member == null) return 'Unknown';
    return '${member['firstName'] ?? ''} ${member['lastName'] ?? ''}'.trim();
  }

  String _assignmentLabel(Map<String, dynamic> assignment) {
    final team = assignment['team'] as Map<String, dynamic>?;
    final occurrence = team?['occurrence'] as Map<String, dynamic>?;
    final title = occurrence?['title'] ?? 'Service';
    final startAt = occurrence?['startAt'];
    return '$title${startAt != null ? ' · $startAt' : ''}';
  }

  Future<void> _submit() async {
    if (_teamMemberId == null || _replacementMemberId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select your assignment and a cover member')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      await _repo.requestReplacement(
        teamMemberId: _teamMemberId!,
        replacementMemberId: _replacementMemberId!,
        reason: _reason.trim().isEmpty ? null : _reason.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Replacement request submitted')),
        );
        Navigator.of(context).pop();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not submit replacement')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Request replacement')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text(
                  'Select the service you cannot attend and who will cover.',
                  style: TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _teamMemberId,
                  decoration: const InputDecoration(
                    labelText: 'Your assignment',
                    border: OutlineInputBorder(),
                  ),
                  items: _assignments
                      .map(
                        (a) => DropdownMenuItem(
                          value: a['id'] as String?,
                          child: Text(_assignmentLabel(a)),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => _teamMemberId = v),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _replacementMemberId,
                  decoration: const InputDecoration(
                    labelText: 'Cover member',
                    border: OutlineInputBorder(),
                  ),
                  items: _members
                      .map((profile) {
                        final member =
                            profile['member'] as Map<String, dynamic>?;
                        final id = member?['id'] as String?;
                        if (id == null) return null;
                        return DropdownMenuItem(
                          value: id,
                          child: Text(_memberLabel(member)),
                        );
                      })
                      .whereType<DropdownMenuItem<String>>()
                      .toList(),
                  onChanged: (v) => setState(() => _replacementMemberId = v),
                ),
                const SizedBox(height: 16),
                TextField(
                  decoration: const InputDecoration(
                    labelText: 'Reason (optional)',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                  onChanged: (v) => _reason = v,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Submit request'),
                ),
                if (_assignments.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 24),
                    child: Text(
                      'No published team assignments yet. Check back after the coordinator publishes a roster.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
              ],
            ),
    );
  }
}
