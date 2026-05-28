import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/localization/locale_provider.dart';

/// Shows member availability hints when assigning (unavailable dates, conflicts).
class MemberAvailabilityPanel extends ConsumerWidget {
  const MemberAvailabilityPanel({
    super.key,
    required this.memberId,
    this.eventId,
  });

  final String memberId;
  final String? eventId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;

    return FutureBuilder<Map<String, dynamic>?>(
      future: _load(ref),
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const SizedBox.shrink();
        }
        final data = snap.data;
        if (data == null) return const SizedBox.shrink();

        final unavailable =
            (data['unavailableDates'] as List?)?.cast<String>() ?? [];
        final conflicts =
            (data['conflicts'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        final attendanceRate = data['attendanceRate'];

        return CmmsCard(
          title: l10n.member_availability_title,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (attendanceRate != null)
                Text(
                  '${l10n.dashboard_kpi_attendance_rate}: $attendanceRate%',
                  softWrap: true,
                ),
              if (unavailable.isNotEmpty) ...[
                const SizedBox(height: CmmsSpacing.xs),
                Text(l10n.member_unavailable_dates_label, softWrap: true),
                ...unavailable.map((d) => Text('• $d', softWrap: true)),
              ],
              if (conflicts.isNotEmpty) ...[
                const SizedBox(height: CmmsSpacing.xs),
                Text(
                  l10n.assignment_conflict_warning,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.error,
                  ),
                  softWrap: true,
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Future<Map<String, dynamic>?> _load(WidgetRef ref) async {
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final res = await api.dio.get('/members/$memberId/availability', queryParameters: {
        if (eventId != null) 'eventId': eventId,
      });
      final data = res.data['data'];
      if (data is Map) return Map<String, dynamic>.from(data);
    } catch (_) {
      return {
        'unavailableDates': <String>[],
        'conflicts': <Map<String, dynamic>>[],
      };
    }
    return null;
  }
}
