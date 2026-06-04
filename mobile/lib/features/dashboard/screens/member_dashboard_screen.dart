import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/governance_permissions.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/models/dashboard_models.dart';
import '../../../core/routing/app_router.dart';
import '../../../core/widgets/localized_card.dart';
import '../../../core/widgets/mobile_tab_shell.dart';
import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';
import '../providers/dashboard_providers.dart';

class MemberDashboardScreen extends ConsumerWidget {
  const MemberDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final summaryAsync = ref.watch(memberDashboardProvider);
    final member = auth.profile?['member'] as Map<String, dynamic>?;
    final name = member != null
        ? '${member['firstName']} ${member['lastName']}'
        : l10n.member_name_fallback;

    final embedded = MobileTabShellScope.embeddedInShell(context);

    final body = RefreshIndicator(
      onRefresh: () async => ref.invalidate(memberDashboardProvider),
      child: summaryAsync.when(
        loading: () => Center(child: Text(l10n.common_loading)),
        error: (_, __) => Center(child: Text(l10n.error_network)),
        data: (summary) {
          final score =
              summary.raw['attendanceScore'] as Map<String, dynamic>?;
          final widgets = summary.widgets;
          final perms = summary.permissionWidgets;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      l10n.dashboard_welcome(name),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).pushNamed(AppRouter.myProfile);
                    },
                    child: Text(l10n.member_profile_title),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              LocalizedCard(
                title: name,
                subtitle: member?['ministry']?.toString(),
                leading: const CircleAvatar(child: Icon(Icons.person)),
              ),
              if (canViewDevotion(auth.permissions)) ...[
                const SizedBox(height: 12),
                _DevotionDashboardCard(
                  onOpen: () => Navigator.of(context).pushNamed(AppRouter.devotions),
                ),
              ],
                if (score != null) ...[
                  const SizedBox(height: 12),
                  LocalizedCard(
                    title: l10n.dashboard_kpi_attendance_rate,
                    subtitle: l10n.attendance_reliability_subtitle(
                      '${score['percentage']}',
                      score['bandLabel']?.toString() ?? '',
                    ),
                    leading: const Icon(Icons.verified_outlined),
                  ),
                ],
                if (summary.alerts.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  ...summary.alerts.take(3).map(
                        (alert) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: LocalizedCard(
                            title: alert.title,
                            subtitle: alert.message,
                            leading: Icon(
                              alert.severity == 'critical'
                                  ? Icons.error_outline
                                  : alert.severity == 'warning'
                                      ? Icons.warning_amber_outlined
                                      : Icons.info_outline,
                            ),
                          ),
                        ),
                      ),
                ],
                if (hasDashboardWidget(widgets, 'kpiOverview')) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: LocalizedCard(
                          title: l10n.dashboard_kpi_upcoming_assignments,
                          subtitle: '${summary.upcomingAssignments}',
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: LocalizedCard(
                          title: l10n.dashboard_kpi_pending_swaps,
                          subtitle: '${summary.pendingSwaps}',
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 16),
                if (hasDashboardWidget(widgets, 'schedule'))
                  _NavTile(
                    icon: Icons.calendar_month,
                    title: l10n.nav_calendar,
                    route: AppRouter.calendar,
                  ),
                if (hasDashboardWidget(widgets, 'attendanceHistory'))
                  _NavTile(
                    icon: Icons.fact_check,
                    title: l10n.nav_attendance,
                    route: AppRouter.attendance,
                  ),
                if (auth.hasPermission('swap:manage') ||
                    hasDashboardWidget(widgets, 'schedule'))
                  _NavTile(
                    icon: Icons.shield_outlined,
                    title: l10n.nav_coverage,
                    route: AppRouter.coverage,
                  ),
                if (perms.replacements || auth.hasPermission('swap:manage'))
                  _NavTile(
                    icon: Icons.swap_horiz,
                    title: l10n.nav_swaps,
                    route: AppRouter.swaps,
                  ),
                if (perms.replacements || auth.hasPermission('swap:manage'))
                  _NavTile(
                    icon: Icons.person_add,
                    title: l10n.nav_replacements,
                    route: AppRouter.replacements,
                  ),
                if (hasDashboardWidget(widgets, 'notifications'))
                  _NavTile(
                    icon: Icons.notifications,
                    title: l10n.nav_notifications,
                    route: AppRouter.notifications,
                  ),
                _NavTile(
                  icon: Icons.home_outlined,
                  title: 'Member portal',
                  route: AppRouter.memberPortalHome,
                ),
                if (auth.hasPermission('discipline:read_all'))
                  _NavTile(
                    icon: Icons.gavel,
                    title: l10n.nav_discipline,
                    route: AppRouter.discipline,
                  ),
                if (perms.financeSnapshot ||
                    member?['ministry'] == 'CHOIR' ||
                    canAccessFinanceNav(auth.permissions))
                  _NavTile(
                    icon: Icons.account_balance_wallet,
                    title: l10n.nav_finance,
                    route: AppRouter.finance,
                  ),
              ],
            );
          },
        ),
      ),
    );

    if (embedded) {
      return body;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.dashboard_member_title),
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
}

class _NavTile extends StatelessWidget {
  const _NavTile({
    required this.icon,
    required this.title,
    required this.route,
  });

  final IconData icon;
  final String title;
  final String route;

  @override
  Widget build(BuildContext context) {
    return LocalizedCard(
      title: title,
      leading: Icon(icon),
      trailing: const Icon(Icons.chevron_right),
      onTap: () => Navigator.pushNamed(context, route),
    );
  }
}

class _DevotionDashboardCard extends ConsumerWidget {
  const _DevotionDashboardCard({required this.onOpen});

  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final async = ref.watch(devotionWidgetProvider);
    return async.when(
      loading: () => LocalizedCard(
        title: l10n.devotion_center_title,
        subtitle: l10n.common_loading,
        leading: const Icon(Icons.menu_book_outlined),
        onTap: onOpen,
      ),
      error: (_, __) => LocalizedCard(
        title: l10n.devotion_center_title,
        subtitle: l10n.devotion_open_center,
        leading: const Icon(Icons.menu_book_outlined),
        onTap: onOpen,
      ),
      data: (widget) {
        final pinned = widget['pinned'] as Map<String, dynamic>?;
        final verse = widget['verseOfDay'] as Map<String, dynamic>?;
        final subtitle = pinned?['title'] as String? ??
            verse?['verseReference'] as String? ??
            l10n.devotion_open_center;
        return LocalizedCard(
          title: l10n.devotion_center_title,
          subtitle: subtitle,
          leading: const Icon(Icons.menu_book_outlined),
          trailing: const Icon(Icons.chevron_right),
          onTap: onOpen,
        );
      },
    );
  }
}
