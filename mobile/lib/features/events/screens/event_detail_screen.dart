import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/components/chips/attendance_status_chip.dart';
import '../../../core/design/tokens/ministry_accents.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/church_localization.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/localization/locale_date_format.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../core/routing/app_router.dart';
import '../providers/event_providers.dart';
import 'event_attendance_bulk_screen.dart';

class EventDetailScreen extends ConsumerWidget {
  const EventDetailScreen({super.key, required this.eventId});

  final String eventId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final lang = ref.watch(localeProvider).languageCode;
    final eventAsync = ref.watch(eventDetailProvider(eventId));
    final auditAsync = ref.watch(eventAuditProvider(eventId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.event_detail_title)),
      body: eventAsync.when(
        loading: () => Center(child: Text(l10n.common_loading)),
        error: (_, __) => Center(child: Text(l10n.error_network)),
        data: (event) {
          final start = DateTime.parse(event['startTime'] as String);
          final end = DateTime.parse(event['endTime'] as String);
          final assignments =
              (event['assignments'] as List?)?.cast<Map<String, dynamic>>() ??
                  [];
          final attendances =
              (event['attendances'] as List?)?.cast<Map<String, dynamic>>() ??
                  [];
          final ministry = MinistryAccents.fromApi(
            event['ministryScope'] as String?,
          );

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(eventDetailProvider(eventId));
              ref.invalidate(eventAuditProvider(eventId));
            },
            child: ListView(
              padding: const EdgeInsets.all(CmmsSpacing.md),
              children: [
                CmmsCard(
                  title: event['title'] as String? ?? '',
                  subtitle: l10n.eventTypeLabel(event['type'] as String? ?? ''),
                  leading: Icon(
                    ministry != null
                        ? MinistryAccents.iconFor(ministry)
                        : Icons.event,
                    color: ministry != null
                        ? MinistryAccents.colorFor(ministry)
                        : null,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${LocaleDateFormat.formatDateTime(start, lang)} – ${LocaleDateFormat.formatTime(end, lang)}',
                        softWrap: true,
                      ),
                      if (event['location'] != null)
                        Padding(
                          padding: const EdgeInsets.only(top: CmmsSpacing.xs),
                          child: Text(
                            '${l10n.event_location_label}: ${event['location']}',
                            softWrap: true,
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: CmmsSpacing.sm),
                Text(
                  l10n.event_assigned_members_title,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                ...assignments.map((a) {
                  final member = a['member'] as Map<String, dynamic>?;
                  final name = member?['fullName'] as String? ??
                      l10n.member_name_fallback;
                  return ListTile(
                    dense: true,
                    title: Text(name, softWrap: true),
                    subtitle: a['isOverride'] == true
                        ? Text(l10n.assignment_manual_override_label)
                        : null,
                  );
                }),
                const SizedBox(height: CmmsSpacing.sm),
                Text(
                  l10n.event_attendance_title,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                ...attendances.map((att) {
                  final member = att['member'] as Map<String, dynamic>?;
                  final name = member?['fullName'] as String? ??
                      l10n.member_name_fallback;
                  return ListTile(
                    dense: true,
                    title: Text(name, softWrap: true),
                    trailing: AttendanceStatusChip.fromPhysical(
                      context,
                      att['physicalStatus'] as String? ?? 'ABSENT',
                      reasonCategory: att['reasonCategory'] as String?,
                    ),
                  );
                }),
                const SizedBox(height: CmmsSpacing.md),
                CmmsButton(
                  label: l10n.event_mark_attendance_action,
                  icon: Icons.fact_check_outlined,
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => EventAttendanceBulkScreen(
                          eventId: eventId,
                          assignments: assignments,
                        ),
                      ),
                    ).then((_) => ref.invalidate(eventDetailProvider(eventId)));
                  },
                ),
                const SizedBox(height: CmmsSpacing.xs),
                CmmsButton(
                  label: l10n.event_assign_action,
                  variant: CmmsButtonVariant.secondary,
                  icon: Icons.group_add_outlined,
                  onPressed: () =>
                      Navigator.pushNamed(context, AppRouter.assignments),
                ),
                const SizedBox(height: CmmsSpacing.lg),
                Text(
                  l10n.event_audit_title,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                auditAsync.when(
                  loading: () => Padding(
                    padding: const EdgeInsets.all(CmmsSpacing.sm),
                    child: Text(l10n.common_loading),
                  ),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (logs) => Column(
                    children: logs
                        .map(
                          (log) => ListTile(
                            dense: true,
                            title: Text(
                              log['action'] as String? ?? '',
                              softWrap: true,
                            ),
                            subtitle: Text(
                              LocaleDateFormat.formatDateTime(
                                DateTime.parse(log['createdAt'] as String),
                                lang,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
