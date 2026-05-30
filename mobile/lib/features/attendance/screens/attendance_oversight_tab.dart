import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/repositories/attendance_repository.dart';
import '../../auth/providers/auth_provider.dart';

class AttendanceOversightTab extends ConsumerStatefulWidget {
  const AttendanceOversightTab({super.key});

  @override
  ConsumerState<AttendanceOversightTab> createState() =>
      _AttendanceOversightTabState();
}

class _AttendanceOversightTabState extends ConsumerState<AttendanceOversightTab> {
  List<Map<String, dynamic>> _items = [];
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
      _items = await repo.disciplineRecommendations();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createCase(Map<String, dynamic> item) async {
    final l10n = context.l10n;
    final auth = ref.read(authProvider);
    if (!auth.hasPermission('discipline:manage')) return;

    final repo = AttendanceRepository(client: ref.read(apiClientProvider));
    await repo.createDisciplineCase(
      memberId: item['memberId'] as String,
      title:
          'Attendance review — ${item['firstName']} ${item['lastName']}',
      description: item['recommendation'] as String? ?? '',
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.attendance_discipline_created)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final canDiscipline = auth.hasPermission('discipline:manage');

    if (_loading) {
      return Center(child: Text(l10n.common_loading));
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(CmmsSpacing.md),
        children: [
          CmmsCard(
            title: l10n.attendance_discipline_title,
            subtitle: l10n.attendance_discipline_subtitle,
          ),
          const SizedBox(height: CmmsSpacing.sm),
          if (_items.isEmpty)
            Padding(
              padding: const EdgeInsets.all(CmmsSpacing.md),
              child: Text(l10n.attendance_discipline_empty),
            )
          else
            ..._items.map((item) {
              return Padding(
                padding: const EdgeInsets.only(bottom: CmmsSpacing.sm),
                child: CmmsCard(
                  title: '${item['firstName']} ${item['lastName']}',
                  subtitle: item['recommendation'] as String? ?? '',
                  child: canDiscipline
                      ? Align(
                          alignment: Alignment.centerLeft,
                          child: CmmsButton(
                            label: l10n.attendance_discipline_create,
                            onPressed: () => _createCase(item),
                          ),
                        )
                      : null,
                ),
              );
            }),
        ],
      ),
    );
  }
}
