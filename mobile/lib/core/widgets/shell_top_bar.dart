import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../design/theme/theme_mode_provider.dart';
import '../design/tokens/colors.dart';
import '../localization/l10n.dart';
import '../routing/app_router.dart';
import 'shell_user.dart';

/// Web TopBar actions: search, help, notifications, profile menu.
class ShellTopBarActions extends ConsumerWidget {
  const ShellTopBarActions({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final themeMode = ref.watch(themeModeProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: const Icon(Icons.search, size: 22),
          tooltip: l10n.search_title,
          onPressed: () => Navigator.pushNamed(context, AppRouter.search),
        ),
        IconButton(
          icon: const Icon(Icons.help_outline, size: 22),
          tooltip: l10n.settings_title,
          onPressed: () => _showHelpSheet(context, l10n),
        ),
        IconButton(
          icon: Badge(
            label: const Text('3'),
            isLabelVisible: true,
            child: const Icon(Icons.notifications_outlined, size: 22),
          ),
          tooltip: l10n.nav_notifications,
          onPressed: () =>
              Navigator.pushNamed(context, AppRouter.notifications),
        ),
        PopupMenuButton<String>(
          tooltip: shellUserLabel(auth),
          offset: const Offset(0, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: CmmsColors.gold500,
              child: Text(
                shellUserInitials(auth),
                style: TextStyle(
                  color: CmmsColors.primary900,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ),
          ),
          onSelected: (value) => _onMenuSelected(context, ref, value),
          itemBuilder: (context) => [
            PopupMenuItem<String>(
              enabled: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    shellUserLabel(auth),
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    shellUserRole(auth),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: CmmsColors.textSecondary(isDark),
                        ),
                  ),
                ],
              ),
            ),
            const PopupMenuDivider(),
            _menuItem(Icons.person_outline, l10n.member_profile_title, 'profile'),
            _menuItem(Icons.settings_outlined, l10n.settings_title, 'settings'),
            _menuItem(
              themeMode == ThemeMode.dark
                  ? Icons.light_mode_outlined
                  : Icons.dark_mode_outlined,
              themeMode == ThemeMode.dark
                  ? l10n.settings_theme_light
                  : l10n.settings_theme_dark,
              'theme',
            ),
            const PopupMenuDivider(),
            _menuItem(Icons.logout, l10n.common_logout, 'logout', danger: true),
          ],
        ),
        const SizedBox(width: 4),
      ],
    );
  }

  PopupMenuItem<String> _menuItem(
    IconData icon,
    String label,
    String value, {
    bool danger = false,
  }) {
    return PopupMenuItem<String>(
      value: value,
      child: Row(
        children: [
          Icon(
            icon,
            size: 18,
            color: danger ? CmmsColors.danger : null,
          ),
          const SizedBox(width: 12),
          Text(
            label,
            style: TextStyle(
              color: danger ? CmmsColors.danger : null,
              fontWeight: danger ? FontWeight.w600 : null,
            ),
          ),
        ],
      ),
    );
  }

  void _onMenuSelected(BuildContext context, WidgetRef ref, String value) {
    switch (value) {
      case 'profile':
        Navigator.pushNamed(context, AppRouter.myProfile);
      case 'settings':
        Navigator.pushNamed(context, AppRouter.settings);
      case 'theme':
        final current = ref.read(themeModeProvider);
        final next = current == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
        ref.read(themeModeProvider.notifier).setMode(next);
      case 'logout':
        _logout(context, ref);
    }
  }

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    await ref.read(authProvider.notifier).logout();
    if (!context.mounted) return;
    Navigator.pushNamedAndRemoveUntil(context, AppRouter.login, (_) => false);
  }

  void _showHelpSheet(BuildContext context, dynamic l10n) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.settings_title,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(Icons.search),
              title: Text(l10n.search_title),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, AppRouter.search);
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined),
              title: Text(l10n.settings_title),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, AppRouter.settings);
              },
            ),
            ListTile(
              leading: const Icon(Icons.sync_outlined),
              title: Text(l10n.nav_sync),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, AppRouter.sync);
              },
            ),
          ],
        ),
      ),
    );
  }
}

/// Desktop/wide top bar row matching web TopBar layout.
class ShellTopBar extends ConsumerWidget {
  const ShellTopBar({
    super.key,
    required this.title,
  });

  final String title;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: CmmsColors.surface(isDark),
        border: Border(
          bottom: BorderSide(
            color: isDark ? CmmsColors.outlineDark : CmmsColors.outlineLight,
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const ShellTopBarActions(),
        ],
      ),
    );
  }
}
