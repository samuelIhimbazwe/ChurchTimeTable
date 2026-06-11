import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../design/components/brand/cmms_brand_logo.dart';
import '../localization/l10n.dart';
import '../routing/app_router.dart';
import '../design/tokens/colors.dart';
import 'shell_destinations.dart';
import 'shell_top_bar.dart';

/// Web-aligned mobile shell: top bar + navy drawer (no bottom tabs).
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final title = AppRouter.pageTitle(context, currentRoute);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return MobileTabShellScope(
      embedded: true,
      child: Scaffold(
        backgroundColor: CmmsColors.surfaceRaised(isDark),
        appBar: AppBar(
          title: Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 18,
            ),
          ),
          actions: const [ShellTopBarActions()],
        ),
        drawer: _WebStyleDrawer(auth: auth, currentRoute: currentRoute),
        body: child,
      ),
    );
  }
}

class _WebStyleDrawer extends ConsumerWidget {
  const _WebStyleDrawer({
    required this.auth,
    required this.currentRoute,
  });

  final AuthState auth;
  final String currentRoute;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final items = buildShellDestinations(l10n, auth);

    return Drawer(
      backgroundColor: CmmsColors.primary900,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              decoration: const BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: CmmsColors.primary800),
                ),
              ),
              child: const CmmsBrandLogo(
                size: 36,
                showWordmark: true,
                subtitle: 'Church System',
                lightContext: true,
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  for (final item in items)
                    _DrawerNavTile(
                      item: item,
                      selected: normalizeShellRoute(currentRoute) ==
                          normalizeShellRoute(item.route),
                      onTap: () {
                        Navigator.pop(context);
                        if (currentRoute != item.route) {
                          Navigator.pushReplacementNamed(context, item.route);
                        }
                      },
                    ),
                ],
              ),
            ),
            Container(
              decoration: const BoxDecoration(
                border: Border(
                  top: BorderSide(color: CmmsColors.primary800),
                ),
              ),
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  _DrawerNavTile(
                    item: ShellDestination(
                      route: AppRouter.settings,
                      icon: Icons.settings_outlined,
                      selectedIcon: Icons.settings,
                      label: l10n.settings_title,
                    ),
                    selected: normalizeShellRoute(currentRoute) ==
                        AppRouter.settings,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.pushReplacementNamed(
                        context,
                        AppRouter.settings,
                      );
                    },
                  ),
                  TextButton.icon(
                    onPressed: () async {
                      await ref.read(authProvider.notifier).logout();
                      if (!context.mounted) return;
                      Navigator.pushNamedAndRemoveUntil(
                        context,
                        AppRouter.login,
                        (_) => false,
                      );
                    },
                    icon: const Icon(
                      Icons.logout,
                      color: CmmsColors.danger,
                      size: 18,
                    ),
                    label: Text(
                      l10n.common_logout,
                      style: const TextStyle(
                        color: CmmsColors.danger,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerNavTile extends StatelessWidget {
  const _DrawerNavTile({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  final ShellDestination item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? CmmsColors.primary800 : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              if (selected)
                Container(
                  width: 3,
                  height: 20,
                  margin: const EdgeInsets.only(right: 10),
                  decoration: BoxDecoration(
                    color: CmmsColors.gold500,
                    borderRadius: BorderRadius.circular(2),
                  ),
                )
              else
                const SizedBox(width: 13),
              Icon(
                selected ? item.selectedIcon : item.icon,
                size: 20,
                color: selected ? CmmsColors.gold400 : CmmsColors.primary300,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  item.label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                    color: selected
                        ? CmmsColors.textInverse
                        : CmmsColors.primary300,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
