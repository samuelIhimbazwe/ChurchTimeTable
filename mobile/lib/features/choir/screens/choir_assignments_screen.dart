import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';
import 'choir_service_prep_detail_screen.dart';

/// Choir scheduling: conflicted assignment accept/decline + upcoming service prep.
class ChoirAssignmentsScreen extends ConsumerStatefulWidget {
  const ChoirAssignmentsScreen({super.key, required this.choirId});

  final String choirId;

  @override
  ConsumerState<ChoirAssignmentsScreen> createState() =>
      _ChoirAssignmentsScreenState();
}

class _ChoirAssignmentsScreenState extends ConsumerState<ChoirAssignmentsScreen> {
  List<Map<String, dynamic>> _pending = const [];
  List<Map<String, dynamic>> _prep = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final repo = ref.read(choirRepositoryProvider);
      final now = DateTime.now();
      final to = DateTime(now.year, now.month + 2, 0);
      List<Map<String, dynamic>> pending = const [];
      try {
        pending = await repo.fetchPendingAcceptance(widget.choirId);
      } catch (_) {
        pending = const [];
      }
      final prep = await repo.fetchMemberServicePrep(
        widget.choirId,
        from: now.toIso8601String(),
        to: to.toIso8601String(),
      );
      setState(() {
        _pending = pending;
        _prep = prep;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = '$e';
        _loading = false;
      });
    }
  }

  Future<void> _accept(String id) async {
    try {
      await ref.read(choirRepositoryProvider).acceptChoirAssignment(id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Assignment accepted')),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not accept: $e')),
      );
    }
  }

  Future<void> _decline(String id) async {
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final ctrl = TextEditingController();
        return AlertDialog(
          title: const Text('Decline assignment'),
          content: TextField(
            controller: ctrl,
            decoration: const InputDecoration(hintText: 'Reason (optional)'),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            TextButton(
              onPressed: () => Navigator.pop(ctx, ctrl.text),
              child: const Text('Decline'),
            ),
          ],
        );
      },
    );
    if (reason == null) return;
    try {
      await ref
          .read(choirRepositoryProvider)
          .declineChoirAssignment(id, reason: reason.isEmpty ? null : reason);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Assignment declined')),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not decline: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Choir scheduling')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(_error!),
                      const SizedBox(height: 12),
                      FilledButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (_pending.isNotEmpty) ...[
                        Text(
                          'Needs confirmation',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        ..._pending.map((a) {
                          final occ = a['occurrence'] as Map?;
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    occ?['title']?.toString() ?? 'Service',
                                    style: Theme.of(context).textTheme.titleSmall,
                                  ),
                                  if (a['conflictReason'] != null)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                        'Conflict: ${a['conflictReason']}',
                                        style: TextStyle(
                                          color: Theme.of(context).colorScheme.error,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      FilledButton(
                                        onPressed: () => _accept(a['id'].toString()),
                                        child: const Text('Accept'),
                                      ),
                                      const SizedBox(width: 8),
                                      OutlinedButton(
                                        onPressed: () => _decline(a['id'].toString()),
                                        child: const Text('Decline'),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        }),
                        const SizedBox(height: 16),
                      ],
                      Text(
                        'Service preparation',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      if (_prep.isEmpty)
                        const Text('No upcoming services with prep.'),
                      ..._prep.map((s) {
                        final occ = s['occurrence'] as Map? ?? {};
                        final occurrenceId = s['occurrenceId']?.toString() ?? '';
                        return ListTile(
                          title: Text(occ['title']?.toString() ?? 'Service'),
                          subtitle: Text(
                            s['hasPlan'] == true ? 'Plan published' : 'Prep pending',
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => ChoirServicePrepDetailScreen(
                                choirId: widget.choirId,
                                occurrenceId: occurrenceId,
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
      ),
    );
  }
}
