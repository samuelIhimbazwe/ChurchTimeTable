import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../design/components/brand/cmms_brand_logo.dart';
import '../design/tokens/colors.dart';
import '../localization/l10n.dart';
import 'mobile_tab_shell.dart';
import '../routing/app_router.dart';
import 'shell_destinations.dart';
import 'shell_top_bar.dart';

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
      case AppRouter.families:
      case AppRouter.ministries:
      case AppRouter.ministryDetail:
      case AppRouter.operationalUnits:
      case AppRouter.operationalUnitDetail:
      case AppRouter.welfare:
      case AppRouter.music:
      case AppRouter.rehearsals:
      case AppRouter.search:
      case AppRouter.devotions:
        return true;
      default:
        return false;
    }
  }

  static String normalizeRoute(String routeName) =>
      normalizeShellRoute(routeName);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final width = MediaQuery.sizeOf(context).width;
    if (width < _desktopBreakpoint) {
      return MobileTabShell(
        currentRoute: currentRoute,
        child: child,
      );
    }

    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final destinations = buildShellDestinations(l10n, auth);
    final selectedRoute = normalizeRoute(currentRoute);
    final selectedIndex = destinations.indexWhere(
      (destination) => destination.route == selectedRoute,
    );
    final extended = width >= 1180;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final pageTitle = AppRouter.pageTitle(context, currentRoute);

    return MobileTabShellScope(
      embedded: true,
      child: Scaffold(
        backgroundColor: CmmsColors.surfaceRaised(isDark),
        body: SafeArea(
        child: Row(
          children: [
            Container(
              width: extended ? 240 : 64,
              color: CmmsColors.primary900,
              child: Column(
                children: [
                  Padding(
                    padding: EdgeInsets.all(extended ? 16 : 8),
                    child: extended
                        ? const CmmsBrandLogo(
                            size: 36,
                            showWordmark: true,
                            subtitle: 'Church System',
                            lightContext: true,
                          )
                        : const CmmsBrandLogo(size: 32, lightContext: true),
                  ),
                  const Divider(height: 1, color: CmmsColors.primary800),
                  Expanded(
                    child: Theme(
                      data: Theme.of(context).copyWith(
                        navigationRailTheme: NavigationRailThemeData(
                          backgroundColor: CmmsColors.primary900,
                          indicatorColor: CmmsColors.primary800,
                          selectedIconTheme: const IconThemeData(
                            color: CmmsColors.gold400,
                            size: 22,
                          ),
                          unselectedIconTheme: const IconThemeData(
                            color: CmmsColors.primary300,
                            size: 22,
                          ),
                          selectedLabelTextStyle: const TextStyle(
                            color: CmmsColors.textInverse,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                          unselectedLabelTextStyle: const TextStyle(
                            color: CmmsColors.primary300,
                            fontWeight: FontWeight.w500,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      child: NavigationRail(
                        extended: extended,
                        minExtendedWidth: 220,
                        selectedIndex: selectedIndex < 0 ? 0 : selectedIndex,
                        useIndicator: true,
                        labelType:
                            extended ? null : NavigationRailLabelType.all,
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
                  ),
                  Padding(
                    padding: EdgeInsets.fromLTRB(
                      extended ? 12 : 4,
                      8,
                      extended ? 12 : 4,
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
              child: Column(
                children: [
                  ShellTopBar(title: pageTitle),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                      child: child,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        ),
      ),
    );
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
        child: TextButton.icon(
          onPressed: onTap,
          icon: Icon(icon, color: CmmsColors.primary300, size: 18),
          label: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              label,
              style: const TextStyle(
                color: CmmsColors.primary300,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      );
    }

    return IconButton(
      onPressed: onTap,
      tooltip: label,
      icon: Icon(icon, color: CmmsColors.primary300),
    );
  }
}
