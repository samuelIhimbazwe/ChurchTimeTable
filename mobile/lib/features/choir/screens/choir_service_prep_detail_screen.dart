import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';

/// Read-only service prep detail with member acknowledgment checklist.
class ChoirServicePrepDetailScreen extends ConsumerStatefulWidget {
  const ChoirServicePrepDetailScreen({
    super.key,
    required this.choirId,
    required this.occurrenceId,
  });

  final String choirId;
  final String occurrenceId;

  @override
  ConsumerState<ChoirServicePrepDetailScreen> createState() =>
      _ChoirServicePrepDetailScreenState();
}

class _ChoirServicePrepDetailScreenState
    extends ConsumerState<ChoirServicePrepDetailScreen> {
  Map<String, dynamic>? _plan;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final data = await ref.read(choirRepositoryProvider).fetchMemberServicePrepDetail(
            widget.choirId,
            widget.occurrenceId,
          );
      setState(() {
        _plan = data;
        _loading = false;
      });
    } catch (_) {
      final data = await ref.read(choirRepositoryProvider).fetchMemberServicePrepDetail(
            widget.choirId,
            widget.occurrenceId,
            offlineFallback: true,
          );
      setState(() {
        _plan = data.isEmpty ? null : data;
        _loading = false;
      });
    }
  }

  List<Map<String, dynamic>> _checklist() {
    final plan = _plan;
    if (plan == null) return const [];
    final list = <Map<String, dynamic>>[];
    final uniform = plan['uniformNotes']?.toString().trim();
    if (uniform != null && uniform.isNotEmpty) {
      list.add({'key': 'uniform', 'label': 'Uniform', 'detail': uniform});
    }
    final pep = plan['pepTalkTitle']?.toString().trim();
    if (pep != null && pep.isNotEmpty) {
      list.add({'key': 'pep_talk', 'label': 'Pep talk / meeting', 'detail': pep});
    }
    final items = (plan['items'] as List?) ?? const [];
    for (final raw in items) {
      final item = Map<String, dynamic>.from(raw as Map);
      final id = item['id']?.toString();
      final title = item['title']?.toString() ?? 'Item';
      final key = id != null ? 'item:$id' : 'item:${item['itemType']}:$title';
      list.add({
        'key': key,
        'label': title,
        'detail': item['body']?.toString() ?? item['song']?['title']?.toString(),
      });
    }
    return list;
  }

  Set<String> get _acks {
    final raw = (_plan?['myAcknowledgments'] as List?) ?? const [];
    return raw.map((e) => e.toString()).toSet();
  }

  Future<void> _ack(String key) async {
    try {
      final updated = await ref.read(choirRepositoryProvider).acknowledgeServicePrep(
            widget.choirId,
            widget.occurrenceId,
            key,
          );
      setState(() => _plan = updated);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final occ = _plan?['occurrence'] as Map?;
    final checklist = _checklist();
    final acks = _acks;
    final ackPct = checklist.isEmpty
        ? 0
        : ((acks.length / checklist.length) * 100).round();

    return Scaffold(
      appBar: AppBar(title: const Text('Service prep')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _plan == null || checklist.isEmpty
              ? const Center(child: Text('No preparation plan published yet.'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text(
                      occ?['title']?.toString() ?? 'Service',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(value: ackPct / 100),
                    Text('$ackPct% acknowledged', style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 16),
                    Text(
                      'My checklist',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    ...checklist.map((item) {
                      final key = item['key'] as String;
                      final done = acks.contains(key);
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Icon(
                            done ? Icons.check_circle : Icons.radio_button_unchecked,
                            color: done ? Colors.green : null,
                          ),
                          title: Text(item['label'] as String),
                          subtitle: item['detail'] != null
                              ? Text(item['detail'] as String)
                              : null,
                          onTap: done ? null : () => _ack(key),
                        ),
                      );
                    }),
                  ],
                ),
    );
  }
}
