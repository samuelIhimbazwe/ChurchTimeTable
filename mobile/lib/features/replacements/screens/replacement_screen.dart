import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/church_localization.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/repositories/replacement_repository.dart';
import '../../../core/widgets/event_picker.dart';
import '../../../core/widgets/member_picker.dart';
import '../../auth/providers/auth_provider.dart';

class ReplacementScreen extends ConsumerStatefulWidget {
  const ReplacementScreen({super.key});

  @override
  ConsumerState<ReplacementScreen> createState() => _ReplacementScreenState();
}

class _ReplacementScreenState extends ConsumerState<ReplacementScreen> {
  final _repo = ReplacementRepository();
  String? _eventId;
  String? _eventTitle;
  String? _absentMemberId;
  String? _coverMemberId;
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final raw = await _repo.list();
      _items = raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _create() async {
    final l10n = context.l10n;
    final auth = ref.read(authProvider);
    final myId = auth.profile?['member']?['id'] as String?;
    if (_eventId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.event_picker_label)),
      );
      return;
    }

    final absentId = _absentMemberId ?? myId;
    if (absentId == null) return;

    try {
      await _repo.create(
        eventId: _eventId!,
        absentMemberId: absentId,
        coverMemberId: _coverMemberId,
        selfFound: _coverMemberId != null,
      );
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              l10n.replacement_requested_for_event(
                _eventTitle ?? l10n.term_event,
              ),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.error_conflict)),
        );
      }
    }
  }

  Future<void> _approve(String id) async {
    await _repo.approve(id);
    _load();
  }

  Future<void> _finalize(String id) async {
    await _repo.finalize(id);
    _load();
  }

  static String _memberName(Map<String, dynamic>? m, String fallback) {
    if (m == null) return fallback;
    return '${m['firstName'] ?? ''} ${m['lastName'] ?? ''}'.trim();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isLeader = ref.watch(authProvider).isLeader;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.replacement_title),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: l10n.common_refresh,
            onPressed: _load,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(CmmsSpacing.md),
          children: [
            CmmsCard(
              title: l10n.replacement_request_action,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  EventPicker(
                    label: l10n.event_picker_label,
                    onSelected: (e) => setState(() {
                      _eventId = e['id'] as String;
                      _eventTitle = e['title'] as String?;
                    }),
                  ),
                  const SizedBox(height: CmmsSpacing.sm),
                  MemberPicker(
                    label: l10n.replacement_absent_member_label,
                    onSelected: (m) =>
                        setState(() => _absentMemberId = m['id'] as String),
                  ),
                  const SizedBox(height: CmmsSpacing.sm),
                  MemberPicker(
                    label: l10n.replacement_cover_member_label,
                    onSelected: (m) =>
                        setState(() => _coverMemberId = m['id'] as String),
                  ),
                  const SizedBox(height: CmmsSpacing.md),
                  CmmsButton(
                    label: l10n.replacement_request_action,
                    onPressed: _create,
                  ),
                ],
              ),
            ),
            const SizedBox(height: CmmsSpacing.lg),
            Text(
              l10n.replacement_list_title,
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: CmmsSpacing.xs),
            if (_loading)
              Padding(
                padding: const EdgeInsets.all(CmmsSpacing.md),
                child: Text(l10n.common_loading),
              )
            else if (_items.isEmpty)
              Padding(
                padding: const EdgeInsets.all(CmmsSpacing.md),
                child: Text(l10n.replacement_list_empty),
              )
            else
              ..._items.map((r) {
                final status = r['status'] as String? ?? '';
                final event = r['event'] as Map<String, dynamic>?;
                final eventName =
                    event?['title'] as String? ?? l10n.term_event;
                final absent = r['absentMember'] as Map<String, dynamic>?;
                final cover = r['coverMember'] as Map<String, dynamic>?;
                return CmmsCard(
                  title: l10n.replacementStatusLabel(status),
                  subtitle: l10n.replacement_list_item_subtitle(
                    eventName,
                    _memberName(absent, l10n.member_name_fallback),
                    cover != null
                        ? _memberName(cover, l10n.member_name_fallback)
                        : '—',
                  ),
                  trailing: isLeader
                      ? PopupMenuButton<String>(
                          onSelected: (v) {
                            if (v == 'approve') _approve(r['id'] as String);
                            if (v == 'finalize') _finalize(r['id'] as String);
                          },
                          itemBuilder: (_) => [
                            if (status == 'LEADER_PENDING')
                              PopupMenuItem(
                                value: 'approve',
                                child: Text(l10n.common_approve),
                              ),
                            if (status == 'APPROVED')
                              PopupMenuItem(
                                value: 'finalize',
                                child: Text(l10n.common_finalize),
                              ),
                          ],
                        )
                      : null,
                );
              }),
          ],
        ),
      ),
    );
  }
}
