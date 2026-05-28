import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_response.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../core/widgets/event_picker.dart';

class ChoirRotationScreen extends ConsumerStatefulWidget {
  const ChoirRotationScreen({super.key});

  @override
  ConsumerState<ChoirRotationScreen> createState() =>
      _ChoirRotationScreenState();
}

class _ChoirRotationScreenState extends ConsumerState<ChoirRotationScreen> {
  String? _eventId;
  Map<String, dynamic>? _pool;
  bool _loading = false;

  Future<void> _loadPool() async {
    if (_eventId == null) return;
    setState(() => _loading = true);
    final api = ref.read(apiClientProvider);
    try {
      await api.loadToken();
      final res = await api.dio.get('/choir/rotation/pool/$_eventId');
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      setState(() => _pool = parsed.data);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _autoAssign() async {
    if (_eventId == null) return;
    final l10n = context.l10n;
    final api = ref.read(apiClientProvider);
    await api.loadToken();
    final res = await api.dio.post(
      '/choir/rotation/events/$_eventId/assign',
      data: {'count': 20},
    );
    final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
      res.data as Map<String, dynamic>,
      (d) => Map<String, dynamic>.from(d as Map),
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            l10n.choir_assigned_count_message(
              (parsed.data?['count'] as num?)?.toInt() ?? 0,
            ),
          ),
        ),
      );
    }
    _loadPool();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final members = (_pool?['members'] as List?) ?? [];

    return Scaffold(
      appBar: AppBar(title: Text(l10n.choir_rotation_title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          EventPicker(
            onSelected: (e) {
              setState(() => _eventId = e['id'] as String);
              _loadPool();
            },
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _loadPool,
                  child: Text(
                    l10n.choir_refresh_pool_action,
                    textAlign: TextAlign.center,
                    softWrap: true,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  onPressed: _eventId != null ? _autoAssign : null,
                  child: Text(
                    l10n.choir_auto_assign_action,
                    textAlign: TextAlign.center,
                    softWrap: true,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_loading) Center(child: Text(l10n.common_loading)),
          Text(
            l10n.choir_eligible_members_label(members.length),
            softWrap: true,
          ),
          ...members.map(
            (m) {
              final member = m as Map<String, dynamic>;
              return ListTile(
                title: Text(
                  '${member['firstName']} ${member['lastName']}',
                  softWrap: true,
                ),
                subtitle: Text(
                  l10n.choir_slot_subtitle(member['serviceNumber'] ?? '-'),
                  softWrap: true,
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
