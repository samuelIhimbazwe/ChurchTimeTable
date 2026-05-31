import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/components/cards/ministry_card.dart';
import '../../../core/design/layout/adaptive_spacing.dart';
import '../../../core/design/tokens/ministry_accents.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../../core/routing/app_router.dart';
import '../../../core/widgets/mobile_tab_shell.dart';
import '../../../core/auth/governance_permissions.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/models/dashboard_models.dart';
import '../providers/dashboard_providers.dart';

class LeaderDashboardScreen extends ConsumerWidget {
  const LeaderDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final showLeaderKpis = auth.hasOperationalLeaderDashboard;
    final summaryAsync = showLeaderKpis
        ? ref.watch(leaderDashboardProvider)
        : const AsyncValue<LeaderDashboardSummary?>.data(null);

    final embedded = MobileTabShellScope.embeddedInShell(context);

    final body = RefreshIndicator(
      onRefresh: () async => ref.invalidate(leaderDashboardProvider),
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: AdaptiveSpacing.screen(context),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.dashboard_section_overview,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: CmmsSpacing.sm),
                    if (showLeaderKpis)
                      summaryAsync.when(
                        loading: () => Text(l10n.common_loading),
                        error: (_, __) => Text(l10n.error_network),
                        data: (s) => _KpiGrid(summary: s, l10n: l10n),
                      )
                    else
                      Text(
                        auth.roleNames.join(' · '),
                        style: Theme.of(context).textTheme.bodyMedium,
                        softWrap: true,
                      ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: AdaptiveSpacing.screen(context),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 240,
                  mainAxisSpacing: CmmsSpacing.sm,
                  crossAxisSpacing: CmmsSpacing.sm,
                  childAspectRatio: 1.05,
                ),
                delegate: SliverChildListDelegate(
                  _staffTiles(context, auth, l10n),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    if (embedded) {
      return body;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.dashboard_leader_title),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () =>
                Navigator.pushNamed(context, AppRouter.settings),
          ),
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: () => Navigator.pushNamed(context, AppRouter.sync),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: l10n.common_logout,
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                Navigator.pushReplacementNamed(context, AppRouter.login);
              }
            },
          ),
        ],
      ),
      body: body,
    );
  }

  static List<Widget> _staffTiles(
    BuildContext context,
    AuthState auth,
    AppLocalizations l10n,
  ) {
    final perms = auth.permissions;
    final tiles = <Widget>[];

    void add(CmmsMinistry ministry, String label, String route, bool show) {
      if (!show) return;
      tiles.add(
        MinistryGridTile(
          ministry: ministry,
          label: label,
          onTap: () => Navigator.pushNamed(context, route),
        ),
      );
    }

    add(CmmsMinistry.protocol, l10n.nav_operational, AppRouter.operational,
        auth.hasOperationalLeaderDashboard);
    add(CmmsMinistry.events, l10n.nav_calendar, AppRouter.calendar,
        auth.hasPermission('event:read'));
    add(CmmsMinistry.general, l10n.nav_assignments, AppRouter.assignments,
        auth.hasPermission('assignment:write'));
    add(CmmsMinistry.choir, l10n.nav_choir_rotation, AppRouter.choirRotation,
        auth.hasPermission('assignment:write'));
    add(CmmsMinistry.protocol, l10n.nav_attendance, AppRouter.attendance,
        canMarkAttendance(perms) || hasProtocolTeamHead(perms));
    add(CmmsMinistry.general, l10n.nav_coverage, AppRouter.coverage,
        auth.hasPermission('swap:manage') ||
            hasProtocolTeamHead(perms) ||
            hasProtocolCoordination(perms));
    add(CmmsMinistry.general, l10n.nav_swaps, AppRouter.swaps,
        auth.hasPermission('swap:manage'));
    add(CmmsMinistry.general, l10n.nav_replacements, AppRouter.replacements,
        auth.hasPermission('swap:manage'));
    add(CmmsMinistry.events, l10n.notifications_title, AppRouter.notifications,
        auth.hasPermission('event:read'));
    add(CmmsMinistry.discipline, l10n.nav_discipline, AppRouter.discipline,
        auth.hasPermission('discipline:read_all'));
    add(CmmsMinistry.finance, l10n.nav_finance, AppRouter.finance,
        auth.hasPermission('finance:read'));
    add(CmmsMinistry.finance, l10n.nav_budgets, AppRouter.budgets,
        auth.hasPermission('finance:write'));
    add(CmmsMinistry.general, l10n.nav_sync, AppRouter.sync, true);

    return tiles;
  }
}

class _KpiGrid extends StatelessWidget {
  const _KpiGrid({required this.summary, required this.l10n});

  final LeaderDashboardSummary summary;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final finance = summary.raw['financeSummary'] as Map<String, dynamic>?;
    final balance = finance?['balance'];

    return GridView.extent(
      maxCrossAxisExtent: 220,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: CmmsSpacing.xs,
      crossAxisSpacing: CmmsSpacing.xs,
      childAspectRatio: 1.4,
      children: [
        CmmsCard(
          title: l10n.dashboard_kpi_upcoming_events,
          child: Text(
            '${summary.upcomingEvents}',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
        ),
        CmmsCard(
          title: l10n.dashboard_kpi_attendance_rate,
          child: Text(
            summary.attendanceRate != null ? '${summary.attendanceRate}%' : '—',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
        ),
        CmmsCard(
          title: l10n.dashboard_kpi_pending_swaps,
          child: Text(
            '${summary.pendingSwaps}',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
        ),
        CmmsCard(
          title: l10n.dashboard_kpi_pending_replacements,
          child: Text(
            '${summary.pendingReplacements}',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
        ),
        CmmsCard(
          title: l10n.dashboard_kpi_active_discipline,
          child: Text(
            '${summary.raw['activeDiscipline'] ?? 0}',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
        ),
        CmmsCard(
          title: l10n.dashboard_kpi_sync_conflicts,
          child: Text(
            '${summary.raw['syncConflicts'] ?? 0}',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
        ),
        if (balance != null)
          CmmsCard(
            title: l10n.dashboard_kpi_finance_balance,
            child: Text(
              '$balance',
              style: Theme.of(context).textTheme.titleLarge,
              softWrap: true,
            ),
          ),
      ],
    );
  }
}
