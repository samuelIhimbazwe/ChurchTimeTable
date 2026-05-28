import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/repositories/swap_repository.dart';
import '../../../core/widgets/event_picker.dart';
import '../../../core/widgets/member_picker.dart';
import '../../../core/widgets/overflow_safe_button.dart';
import '../../auth/providers/auth_provider.dart';

class SwapDetailScreen extends ConsumerStatefulWidget {
  const SwapDetailScreen({super.key, this.swap});

  final Map<String, dynamic>? swap;

  @override
  ConsumerState<SwapDetailScreen> createState() => _SwapDetailScreenState();
}

class _SwapDetailScreenState extends ConsumerState<SwapDetailScreen> {
  final _repo = SwapRepository();
  String? _eventId;
  String? _targetId;

  Map<String, dynamic>? get _swap => widget.swap;
  String get _status => _swap?['status'] as String? ?? 'NEW';
  String get _swapId => _swap?['id'] as String? ?? '';

  Future<void> _request() async {
    if (_eventId == null || _targetId == null) return;
    await _repo.request(_eventId!, _targetId!);
    if (mounted) Navigator.pop(context);
  }

  Future<void> _respond(bool accept) async {
    await _repo.respond(_swapId, accept);
    if (mounted) Navigator.pop(context, true);
  }

  Future<void> _approve() async {
    await _repo.approve(_swapId);
    if (mounted) Navigator.pop(context, true);
  }

  Future<void> _finalize() async {
    await _repo.finalize(_swapId);
    if (mounted) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final memberId = auth.profile?['member']?['id'] as String?;
    final isTarget = _swap != null && _swap!['targetId'] == memberId;
    final isNew = _swap == null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isNew ? l10n.swap_request_action : l10n.swap_details_title),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (isNew) ...[
              EventPicker(
                onSelected: (e) => setState(() => _eventId = e['id'] as String),
              ),
              const SizedBox(height: 12),
              MemberPicker(
                label: l10n.swap_with_member_label,
                onSelected: (m) =>
                    setState(() => _targetId = m['id'] as String),
              ),
              const Spacer(),
              OverflowSafeButton(
                label: l10n.swap_request_action,
                onPressed: _request,
              ),
            ] else ...[
              Text(
                _status,
                style: Theme.of(context).textTheme.titleMedium,
                softWrap: true,
              ),
              const SizedBox(height: 8),
              Text(
                _swap!['eventId']?.toString() ?? '',
                softWrap: true,
              ),
              const Spacer(),
              if (_status == 'REQUESTED' && isTarget) ...[
                OverflowSafeButton(
                  label: l10n.swap_accept_action,
                  onPressed: () => _respond(true),
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: () => _respond(false),
                  child: Text(l10n.swap_reject_action),
                ),
              ],
              if (_status == 'LEADER_PENDING' && auth.isLeader)
                OverflowSafeButton(
                  label: l10n.swap_leader_approve_action,
                  onPressed: _approve,
                ),
              if (_status == 'APPROVED' && auth.isLeader)
                OverflowSafeButton(
                  label: l10n.swap_finalize_action,
                  onPressed: _finalize,
                ),
            ],
          ],
        ),
      ),
    );
  }
}
