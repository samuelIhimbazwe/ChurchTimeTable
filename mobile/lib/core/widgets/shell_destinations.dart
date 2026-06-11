import 'package:flutter/material.dart';

import '../auth/governance_permissions.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../l10n/generated/app_localizations.dart';
import '../routing/app_router.dart';

class ShellDestination {
  const ShellDestination({
    required this.route,
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });

  final String route;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
}

List<ShellDestination> buildShellDestinations(
  AppLocalizations l10n,
  AuthState auth,
) {
  final items = <ShellDestination>[
    ShellDestination(
      route: auth.canAccessLeaderDashboard
          ? AppRouter.leaderDashboard
          : AppRouter.memberDashboard,
      icon: Icons.dashboard_outlined,
      selectedIcon: Icons.dashboard,
      label: auth.canAccessLeaderDashboard
          ? l10n.dashboard_leader_title
          : l10n.dashboard_member_title,
    ),
  ];

  void add({
    required String route,
    required IconData icon,
    IconData? selectedIcon,
    required String label,
    required bool show,
  }) {
    if (!show) return;
    items.add(
      ShellDestination(
        route: route,
        icon: icon,
        selectedIcon: selectedIcon ?? icon,
        label: label,
      ),
    );
  }

  if (auth.canAccessLeaderDashboard) {
    add(
      route: AppRouter.operational,
      icon: Icons.dashboard_outlined,
      selectedIcon: Icons.dashboard,
      label: l10n.nav_operational,
      show: hasOperationalLeaderDashboard(auth.permissions),
    );
    add(
      route: AppRouter.calendar,
      icon: Icons.calendar_month_outlined,
      selectedIcon: Icons.calendar_month,
      label: l10n.nav_calendar,
      show: auth.hasPermission('event:read'),
    );
    add(
      route: AppRouter.assignments,
      icon: Icons.assignment_outlined,
      selectedIcon: Icons.assignment,
      label: l10n.nav_assignments,
      show: auth.hasPermission('assignment:write'),
    );
    add(
      route: AppRouter.choirRotation,
      icon: Icons.music_note_outlined,
      selectedIcon: Icons.music_note,
      label: l10n.nav_choir_rotation,
      show: auth.hasPermission('assignment:write'),
    );
    add(
      route: AppRouter.attendance,
      icon: Icons.fact_check_outlined,
      selectedIcon: Icons.fact_check,
      label: l10n.nav_attendance,
      show: canAccessAttendanceNav(auth.permissions),
    );
    add(
      route: AppRouter.coverage,
      icon: Icons.shield_outlined,
      selectedIcon: Icons.shield,
      label: l10n.nav_coverage,
      show: canAccessCoverageNav(auth.permissions),
    );
    add(
      route: AppRouter.swaps,
      icon: Icons.swap_horiz_outlined,
      selectedIcon: Icons.swap_horiz,
      label: l10n.nav_swaps,
      show: auth.hasPermission('swap:manage'),
    );
    add(
      route: AppRouter.replacements,
      icon: Icons.person_add_alt_outlined,
      selectedIcon: Icons.person_add_alt_1,
      label: l10n.nav_replacements,
      show: auth.hasPermission('swap:manage'),
    );
    add(
      route: AppRouter.notifications,
      icon: Icons.notifications_outlined,
      selectedIcon: Icons.notifications,
      label: l10n.nav_notifications,
      show: auth.hasPermission('event:read'),
    );
    add(
      route: AppRouter.discipline,
      icon: Icons.gavel_outlined,
      selectedIcon: Icons.gavel,
      label: l10n.nav_discipline,
      show: auth.hasPermission('discipline:read_all'),
    );
    add(
      route: AppRouter.finance,
      icon: Icons.account_balance_wallet_outlined,
      selectedIcon: Icons.account_balance_wallet,
      label: l10n.nav_finance,
      show: canAccessFinanceNav(auth.permissions),
    );
    add(
      route: AppRouter.budgets,
      icon: Icons.pie_chart_outline,
      selectedIcon: Icons.pie_chart,
      label: l10n.nav_budgets,
      show: canAccessFinanceNav(auth.permissions) &&
          hasEffectivePermission(auth.permissions, 'choir.finance.manage'),
    );
    add(
      route: AppRouter.members,
      icon: Icons.people_outlined,
      selectedIcon: Icons.people,
      label: l10n.nav_members,
      show: auth.hasPermission('member:manage'),
    );
    add(
      route: AppRouter.families,
      icon: Icons.family_restroom_outlined,
      selectedIcon: Icons.family_restroom,
      label: l10n.families_title,
      show: canViewFamilies(auth.permissions),
    );
    add(
      route: AppRouter.ministries,
      icon: Icons.church_outlined,
      selectedIcon: Icons.church,
      label: l10n.ministries_title,
      show: canViewMinistries(auth.permissions),
    );
    add(
      route: AppRouter.operationalUnits,
      icon: Icons.groups_outlined,
      selectedIcon: Icons.groups,
      label: l10n.operational_units_title,
      show: canViewOperationalUnits(auth.permissions),
    );
    add(
      route: AppRouter.welfare,
      icon: Icons.volunteer_activism_outlined,
      selectedIcon: Icons.volunteer_activism,
      label: l10n.welfare_title,
      show: canViewWelfare(auth.permissions),
    );
    add(
      route: AppRouter.music,
      icon: Icons.library_music_outlined,
      selectedIcon: Icons.library_music,
      label: l10n.music_title,
      show: canViewMusic(auth.permissions),
    );
    add(
      route: AppRouter.rehearsals,
      icon: Icons.music_note_outlined,
      selectedIcon: Icons.music_note,
      label: l10n.rehearsals_title,
      show: canViewRehearsals(auth.permissions),
    );
    add(
      route: AppRouter.search,
      icon: Icons.search,
      selectedIcon: Icons.search,
      label: l10n.search_title,
      show: true,
    );
    add(
      route: AppRouter.sync,
      icon: Icons.sync_outlined,
      selectedIcon: Icons.sync,
      label: l10n.nav_sync,
      show: true,
    );
  } else {
    final member = auth.profile?['member'] as Map<String, dynamic>?;
    add(
      route: AppRouter.calendar,
      icon: Icons.calendar_month_outlined,
      selectedIcon: Icons.calendar_month,
      label: l10n.nav_calendar,
      show: true,
    );
    add(
      route: AppRouter.attendance,
      icon: Icons.fact_check_outlined,
      selectedIcon: Icons.fact_check,
      label: l10n.nav_attendance,
      show: true,
    );
    add(
      route: AppRouter.coverage,
      icon: Icons.shield_outlined,
      selectedIcon: Icons.shield,
      label: l10n.nav_coverage,
      show: true,
    );
    add(
      route: AppRouter.swaps,
      icon: Icons.swap_horiz_outlined,
      selectedIcon: Icons.swap_horiz,
      label: l10n.nav_swaps,
      show: true,
    );
    add(
      route: AppRouter.replacements,
      icon: Icons.person_add_alt_outlined,
      selectedIcon: Icons.person_add_alt_1,
      label: l10n.nav_replacements,
      show: true,
    );
    add(
      route: AppRouter.notifications,
      icon: Icons.notifications_outlined,
      selectedIcon: Icons.notifications,
      label: l10n.nav_notifications,
      show: true,
    );
    add(
      route: AppRouter.discipline,
      icon: Icons.gavel_outlined,
      selectedIcon: Icons.gavel,
      label: l10n.nav_discipline,
      show: true,
    );
    add(
      route: AppRouter.finance,
      icon: Icons.account_balance_wallet_outlined,
      selectedIcon: Icons.account_balance_wallet,
      label: l10n.nav_finance,
      show: member?['ministry'] == 'CHOIR',
    );
    add(
      route: AppRouter.welfare,
      icon: Icons.volunteer_activism_outlined,
      selectedIcon: Icons.volunteer_activism,
      label: l10n.welfare_title,
      show: canViewWelfare(auth.permissions),
    );
    add(
      route: AppRouter.music,
      icon: Icons.library_music_outlined,
      selectedIcon: Icons.library_music,
      label: l10n.music_title,
      show: canViewMusic(auth.permissions),
    );
    add(
      route: AppRouter.rehearsals,
      icon: Icons.music_note_outlined,
      selectedIcon: Icons.music_note,
      label: l10n.rehearsals_title,
      show: canViewRehearsals(auth.permissions),
    );
    add(
      route: AppRouter.search,
      icon: Icons.search,
      selectedIcon: Icons.search,
      label: l10n.search_title,
      show: true,
    );
    add(
      route: AppRouter.sync,
      icon: Icons.sync_outlined,
      selectedIcon: Icons.sync,
      label: l10n.nav_sync,
      show: true,
    );
  }

  return items;
}

String normalizeShellRoute(String routeName) {
  if (routeName == AppRouter.language) return AppRouter.settings;
  return routeName;
}
