import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/governance_permissions.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../localization/l10n.dart';
import '../routing/app_router.dart';
import '../routing/route_permissions.dart';
import '../design/tokens/colors.dart';

class MobileTabShellScope extends InheritedWidget {
  const MobileTabShellScope({
    super.key,
    required this.embedded,
    required super.child,
  });

  final bool embedded;

  static bool embeddedInShell(BuildContext context) {
    return context
            .dependOnInheritedWidgetOfExactType<MobileTabShellScope>()
            ?.embedded ??
        false;
  }

  @override
  bool updateShouldNotify(MobileTabShellScope oldWidget) =>
      embedded != oldWidget.embedded;
}

class MobileTabShell extends ConsumerWidget {
  const MobileTabShell({
    super.key,
    required this.currentRoute,
    required this.child,
  });

  final String currentRoute;
  final Widget child;

  static const _desktopBreakpoint = 900.0;

  static bool shouldUse(String? routeName) {
    switch (routeName) {
      case AppRouter.memberDashboard:
      case AppRouter.leaderDashboard:
      case AppRouter.members:
      case AppRouter.calendar:
        return true;
      default:
        return false;
    }
  }

  int _tabIndex(AuthState auth) {
    switch (currentRoute) {
      case AppRouter.members:
        return 1;
      case AppRouter.calendar:
        return 2;
      case AppRouter.memberDashboard:
      case AppRouter.leaderDashboard:
      default:
        return 0;
    }
  }

  String _homeRoute(AuthState auth) => dashboardRouteForPermissions(auth.permissions);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final width = MediaQuery.sizeOf(context).width;
    if (width >= _desktopBreakpoint) {
      return child;
    }

    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final selectedIndex = _tabIndex(auth);
    final title = AppRouter.pageTitle(context, currentRoute);
    final showFab = currentRoute == AppRouter.members;

    return MobileTabShellScope(
      embedded: true,
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(
          title: Text(title),
          actions: [
            IconButton(
              icon: Badge(
                label: const Text('3'),
                child: const Icon(Icons.notifications_outlined),
              ),
              onPressed: () =>
                  Navigator.pushNamed(context, AppRouter.notifications),
            ),
          ],
        ),
        drawer: _MobileDrawer(auth: auth),
        body: child,
        floatingActionButton: showFab
            ? FloatingActionButton(
                onPressed: () {},
                child: const Icon(Icons.add),
              )
            : null,
        bottomNavigationBar: NavigationBar(
          selectedIndex: selectedIndex,
          onDestinationSelected: (index) {
            final target = switch (index) {
              0 => _homeRoute(auth),
              1 => AppRouter.members,
              2 => AppRouter.calendar,
              _ => null,
            };
            if (target == null) {
              Scaffold.of(context).openDrawer();
              return;
            }
            if (target == currentRoute) return;
            Navigator.pushReplacementNamed(context, target);
          },
          destinations: [
            NavigationDestination(
              icon: const Icon(Icons.home_outlined),
              selectedIcon: const Icon(Icons.home),
              label: l10n.nav_home,
            ),
            NavigationDestination(
              icon: const Icon(Icons.people_outline),
              selectedIcon: const Icon(Icons.people),
              label: l10n.nav_members,
            ),
            NavigationDestination(
              icon: const Icon(Icons.event_outlined),
              selectedIcon: const Icon(Icons.event),
              label: l10n.nav_events,
            ),
            NavigationDestination(
              icon: const Icon(Icons.more_horiz),
              selectedIcon: const Icon(Icons.more_horiz),
              label: l10n.nav_more,
            ),
          ],
        ),
      ),
    );
  }
}

class _MobileDrawer extends ConsumerWidget {
  const _MobileDrawer({required this.auth});

  final AuthState auth;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final items = <_DrawerItem>[
      _DrawerItem(AppRouter.search, l10n.search_title, Icons.search),
      if (hasOperationalLeaderDashboard(auth.permissions))
        _DrawerItem(AppRouter.operational, l10n.nav_operational, Icons.dashboard_outlined),
      if (canAccessAttendanceNav(auth.permissions))
        _DrawerItem(AppRouter.attendance, l10n.nav_attendance, Icons.fact_check_outlined),
      if (canAccessCoverageNav(auth.permissions))
        _DrawerItem(AppRouter.coverage, l10n.nav_coverage, Icons.shield_outlined),
      if (auth.hasPermission('swap:manage'))
        _DrawerItem(AppRouter.swaps, l10n.nav_swaps, Icons.swap_horiz_outlined),
      if (canAccessFinanceNav(auth.permissions))
        _DrawerItem(AppRouter.finance, l10n.nav_finance, Icons.account_balance_wallet_outlined),
      if (canViewFamilies(auth.permissions))
        _DrawerItem(AppRouter.families, l10n.families_title, Icons.family_restroom_outlined),
      if (canViewWelfare(auth.permissions))
        _DrawerItem(AppRouter.welfare, l10n.welfare_title, Icons.volunteer_activism_outlined),
      if (canViewMusic(auth.permissions))
        _DrawerItem(AppRouter.music, l10n.music_title, Icons.library_music_outlined),
      if (canViewRehearsals(auth.permissions))
        _DrawerItem(AppRouter.rehearsals, l10n.rehearsals_title, Icons.music_note_outlined),
      _DrawerItem(AppRouter.sync, l10n.nav_sync, Icons.sync_outlined),
      _DrawerItem(AppRouter.settings, l10n.nav_settings, Icons.settings_outlined),
    ];

    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l10n.app_title, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 4),
                  Text(
                    l10n.app_tagline,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                children: [
                  for (final item in items)
                    ListTile(
                      leading: Icon(item.icon),
                      title: Text(item.label),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.pushNamed(context, item.route);
                      },
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (!context.mounted) return;
                  Navigator.pushNamedAndRemoveUntil(
                    context,
                    AppRouter.login,
                    (_) => false,
                  );
                },
                icon: const Icon(Icons.logout, color: CmmsColors.danger),
                label: Text(
                  l10n.common_logout,
                  style: const TextStyle(color: CmmsColors.danger),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerItem {
  const _DrawerItem(this.route, this.label, this.icon);

  final String route;
  final String label;
  final IconData icon;
}
