import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/governance_permissions.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/components/cards/cmms_stat_tile.dart';
import '../../../core/widgets/shell_aware_scaffold.dart';
import '../../../core/design/layout/adaptive_spacing.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/routing/app_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/dashboard_providers.dart';

class OperationalDashboardScreen extends ConsumerWidget {
  const OperationalDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final role = resolveOperationalDashboardRole(auth.permissions);

    if (role == null) {
      return ShellAwareScaffold(
        title: l10n.operational_title,
        body: Center(child: Text(l10n.operational_unauthorized)),
      );
    }

    final summaryAsync = ref.watch(operationalDashboardProvider(role));

    return ShellAwareScaffold(
      title: l10n.operational_title,
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(operationalDashboardProvider(role)),
        child: summaryAsync.when(
          loading: () => Center(child: Text(l10n.common_loading)),
          error: (_, __) => Center(child: Text(l10n.error_network)),
          data: (data) => ListView(
            padding: AdaptiveSpacing.screen(context),
            children: [
              Text(
                _subtitleForRole(l10n, role),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: CmmsSpacing.md),
              ..._statTiles(context, l10n, role, data),
              const SizedBox(height: CmmsSpacing.md),
              CmmsCard(
                title: l10n.operational_workflows_title,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    FilledButton(
                      onPressed: () =>
                          Navigator.pushNamed(context, AppRouter.attendance),
                      child: Text(l10n.operational_open_attendance),
                    ),
                    if (role == 'president' ||
                        role == 'coordinator' ||
                        role == 'team-head') ...[
                      const SizedBox(height: CmmsSpacing.sm),
                      OutlinedButton(
                        onPressed: () =>
                            Navigator.pushNamed(context, AppRouter.coverage),
                        child: Text(l10n.operational_open_coverage),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _subtitleForRole(dynamic l10n, String role) {
    switch (role) {
      case 'president':
        return l10n.operational_subtitle_president;
      case 'coordinator':
        return l10n.operational_subtitle_coordinator;
      case 'team-head':
        return l10n.operational_subtitle_team_head;
      default:
        return l10n.operational_subtitle_choir_leader;
    }
  }

  static List<Widget> _statTiles(
    BuildContext context,
    dynamic l10n,
    String role,
    Map<String, dynamic> data,
  ) {
    int n(dynamic v) => v is num ? v.toInt() : 0;
    int listLen(dynamic v) => v is List ? v.length : 0;

    final stats = <(String, int)>[];
    if (role == 'president') {
      stats.addAll([
        (l10n.operational_stat_active_teams, n(data['activeTeams'])),
        (l10n.operational_stat_escalated, n(data['escalatedCount'])),
        (l10n.operational_stat_pending_replacements, n(data['pendingReplacements'])),
        (l10n.operational_stat_discipline_risk, n(data['disciplineRiskCount'])),
      ]);
    } else if (role == 'coordinator') {
      stats.addAll([
        (l10n.operational_stat_active_teams, n(data['activeTeams'])),
        (l10n.operational_stat_escalated, listLen(data['escalated'])),
        (l10n.operational_stat_readiness, n(data['readinessWarnings'])),
        (l10n.operational_stat_pending_replacements, n(data['pendingReplacements'])),
      ]);
    } else if (role == 'team-head') {
      stats.addAll([
        (l10n.operational_stat_teams, listLen(data['teams'])),
        (l10n.operational_stat_escalated, listLen(data['escalations'])),
        (l10n.operational_stat_pending_absences, listLen(data['pendingAbsences'])),
      ]);
    }

    if (stats.isEmpty) {
      return [
        CmmsCard(
          title: l10n.operational_choir_summary_title,
          child: Text(l10n.operational_choir_summary_hint),
        ),
      ];
    }

    return [
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: CmmsSpacing.sm,
        crossAxisSpacing: CmmsSpacing.sm,
        childAspectRatio: 1.35,
        children: stats
            .asMap()
            .entries
            .map(
              (entry) => CmmsStatTile(
                label: entry.value.$1,
                value: '${entry.value.$2}',
                accent: entry.key == 0,
              ),
            )
            .toList(),
      ),
    ];
  }
}
