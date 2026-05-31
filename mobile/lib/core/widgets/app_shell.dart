import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/governance_permissions.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../localization/l10n.dart';
import '../routing/app_router.dart';
import 'mobile_tab_shell.dart';

class AppShell extends ConsumerWidget {
  const AppShell({
    super.key,
    required this.currentRoute,
    required this.child,
  });

  final String currentRoute;
  final Widget child;

  static const _desktopBreakpoint = 900.0;

  static bool shouldWrap(String? routeName) {
    switch (routeName) {
      case AppRouter.memberDashboard:
      case AppRouter.leaderDashboard:
      case AppRouter.operational:
      case AppRouter.calendar:
      case AppRouter.attendance:
      case AppRouter.coverage:
      case AppRouter.swaps:
      case AppRouter.replacements:
      case AppRouter.discipline:
      case AppRouter.finance:
      case AppRouter.sync:
      case AppRouter.notifications:
      case AppRouter.assignments:
      case AppRouter.choirRotation:
      case AppRouter.budgets:
      case AppRouter.settings:
      case AppRouter.language:
      case AppRouter.members:
        return true;
      default:
        return false;
    }
  }

  static String normalizeRoute(String routeName) {
    if (routeName == AppRouter.language) {
      return AppRouter.settings;
    }
    return routeName;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final width = MediaQuery.sizeOf(context).width;
    final auth = ref.watch(authProvider);
    if (width < _desktopBreakpoint || !auth.isAuthenticated) {
      if (MobileTabShell.shouldUse(currentRoute)) {
        return MobileTabShell(
          currentRoute: currentRoute,
          child: child,
        );
      }
      return child;
    }

    final l10n = context.l10n;
    final destinations = _buildDestinations(l10n, auth);
    final selectedRoute = normalizeRoute(currentRoute);
    final selectedIndex = destinations.indexWhere(
      (destination) => destination.route == selectedRoute,
    );
    final extended = width >= 1180;
    final userLabel = _userLabel(auth);
    final subtitle = auth.roleNames.isEmpty ? null : auth.roleNames.join(' · ');
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = Theme.of(context).colorScheme.primary;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Row(
          children: [
            Container(
              width: extended ? 280 : 96,
              margin: const EdgeInsets.fromLTRB(20, 20, 0, 20),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: Theme.of(context).colorScheme.outlineVariant,
                ),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: EdgeInsets.all(extended ? 20 : 12),
                    child: _ShellBrand(
                      extended: extended,
                      title: l10n.app_title,
                      subtitle: subtitle,
                      userLabel: userLabel,
                      brandColor: primary,
                    ),
                  ),
                  Expanded(
                    child: NavigationRail(
                      extended: extended,
                      minExtendedWidth: 232,
                      selectedIndex: selectedIndex < 0 ? 0 : selectedIndex,
                      useIndicator: true,
                      labelType: extended ? null : NavigationRailLabelType.all,
                      leading: const SizedBox(height: 8),
                      destinations: [
                        for (final destination in destinations)
                          NavigationRailDestination(
                            icon: Icon(destination.icon),
                            selectedIcon: Icon(destination.selectedIcon),
                            label: Text(destination.label),
                          ),
                      ],
                      onDestinationSelected: (index) => _navigateTo(
                        context,
                        targetRoute: destinations[index].route,
                      ),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.fromLTRB(
                      extended ? 16 : 8,
                      8,
                      extended ? 16 : 8,
                      16,
                    ),
                    child: Column(
                      children: [
                        _ShellAction(
                          extended: extended,
                          icon: Icons.settings_outlined,
                          label: l10n.settings_title,
                          onTap: () => _navigateTo(
                            context,
                            targetRoute: AppRouter.settings,
                          ),
                        ),
                        const SizedBox(height: 8),
                        _ShellAction(
                          extended: extended,
                          icon: Icons.logout,
                          label: l10n.common_logout,
                          onTap: () async {
                            await ref.read(authProvider.notifier).logout();
                            if (!context.mounted) return;
                            Navigator.pushNamedAndRemoveUntil(
                              context,
                              AppRouter.login,
                              (_) => false,
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1360),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(
                          color: Theme.of(context).colorScheme.outlineVariant,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(
                              alpha: isDark ? 0.35 : 0.05,
                            ),
                            blurRadius: 24,
                            offset: const Offset(0, 12),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(28),
                        child: child,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _userLabel(AuthState auth) {
    final member = auth.profile?['member'] as Map<String, dynamic>?;
    final firstName = member?['firstName']?.toString();
    final lastName = member?['lastName']?.toString();
    final fullName = [firstName, lastName]
        .whereType<String>()
        .where((value) => value.isNotEmpty)
        .join(' ');
    if (fullName.isNotEmpty) {
      return fullName;
    }
    return auth.profile?['email']?.toString() ?? 'CMMS User';
  }

  List<_ShellDestination> _buildDestinations(
    AppLocalizations l10n,
    AuthState auth,
  ) {
    final items = <_ShellDestination>[
      _ShellDestination(
        route: auth.isStaff
            ? AppRouter.leaderDashboard
            : AppRouter.memberDashboard,
        icon: Icons.dashboard_outlined,
        selectedIcon: Icons.dashboard,
        label: auth.isStaff
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
        _ShellDestination(
          route: route,
          icon: icon,
          selectedIcon: selectedIcon ?? icon,
          label: label,
        ),
      );
    }

    if (auth.isStaff) {
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
        show: canMarkAttendance(auth.permissions) ||
            hasProtocolTeamHead(auth.permissions),
      );
      add(
        route: AppRouter.coverage,
        icon: Icons.shield_outlined,
        selectedIcon: Icons.shield,
        label: l10n.nav_coverage,
        show: auth.hasPermission('swap:manage') ||
            hasProtocolTeamHead(auth.permissions) ||
            hasProtocolCoordination(auth.permissions),
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
        show: auth.hasPermission('finance:read'),
      );
      add(
        route: AppRouter.budgets,
        icon: Icons.pie_chart_outline,
        selectedIcon: Icons.pie_chart,
        label: l10n.nav_budgets,
        show: auth.hasPermission('finance:write'),
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
        route: AppRouter.sync,
        icon: Icons.sync_outlined,
        selectedIcon: Icons.sync,
        label: l10n.nav_sync,
        show: true,
      );
    }

    return items;
  }

  void _navigateTo(
    BuildContext context, {
    required String targetRoute,
  }) {
    if (normalizeRoute(currentRoute) == normalizeRoute(targetRoute)) {
      return;
    }
    Navigator.pushReplacementNamed(context, targetRoute);
  }
}

class _ShellBrand extends StatelessWidget {
  const _ShellBrand({
    required this.extended,
    required this.title,
    required this.subtitle,
    required this.userLabel,
    required this.brandColor,
  });

  final bool extended;
  final String title;
  final String? subtitle;
  final String userLabel;
  final Color brandColor;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    if (!extended) {
      return Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: brandColor.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(Icons.church, color: brandColor),
          ),
          const SizedBox(height: 12),
          Text(
            userLabel.characters.first.toUpperCase(),
            style: textTheme.titleMedium,
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: brandColor.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Icon(Icons.church, color: brandColor, size: 28),
        ),
        const SizedBox(height: 16),
        Text(title, style: textTheme.titleLarge),
        const SizedBox(height: 4),
        Text(
          userLabel,
          style: textTheme.bodyMedium,
          overflow: TextOverflow.ellipsis,
        ),
        if (subtitle != null && subtitle!.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            subtitle!,
            style: textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ],
    );
  }
}

class _ShellAction extends StatelessWidget {
  const _ShellAction({
    required this.extended,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final bool extended;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    if (extended) {
      return SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          onPressed: onTap,
          icon: Icon(icon),
          label: Align(
            alignment: Alignment.centerLeft,
            child: Text(label),
          ),
        ),
      );
    }

    return IconButton(
      onPressed: onTap,
      tooltip: label,
      icon: Icon(icon),
    );
  }
}

class _ShellDestination {
  const _ShellDestination({
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
