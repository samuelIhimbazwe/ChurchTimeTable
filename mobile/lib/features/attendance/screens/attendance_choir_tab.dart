import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/repositories/attendance_repository.dart';

class AttendanceChoirTab extends ConsumerStatefulWidget {
  const AttendanceChoirTab({super.key});

  @override
  ConsumerState<AttendanceChoirTab> createState() => _AttendanceChoirTabState();
}

class _AttendanceChoirTabState extends ConsumerState<AttendanceChoirTab> {
  Map<String, dynamic>? _summary;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final repo = AttendanceRepository(client: ref.read(apiClientProvider));
    try {
      _summary = await repo.choirSummary();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    if (_loading) {
      return Center(child: Text(l10n.common_loading));
    }
    final data = _summary ?? {};
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(CmmsSpacing.md),
        children: [
          CmmsCard(
            title: l10n.attendance_choir_title,
            child: Wrap(
              spacing: CmmsSpacing.md,
              runSpacing: CmmsSpacing.sm,
              children: [
                _Stat(l10n.attendance_choir_marked, data['totalMarked']),
                _Stat(l10n.attendance_choir_excused, data['excused']),
                _Stat(l10n.attendance_choir_unexcused, data['unexcused']),
                _Stat(l10n.attendance_choir_lateness, data['repeatedLateness']),
                _Stat(
                  l10n.attendance_choir_pending_review,
                  data['pendingExcuseReview'],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.label, this.value);

  final String label;
  final dynamic value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 120,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          Text('${value ?? 0}', style: Theme.of(context).textTheme.titleLarge),
        ],
      ),
    );
  }
}
