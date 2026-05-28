import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/routing/app_router.dart';
import '../../../core/widgets/localized_card.dart';
import '../../auth/providers/auth_provider.dart';

class MemberDashboardScreen extends ConsumerWidget {
  const MemberDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final member = auth.profile?['member'] as Map<String, dynamic>?;
    final name = member != null
        ? '${member['firstName']} ${member['lastName']}'
        : l10n.member_name_fallback;

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
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 840),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              LocalizedCard(
                title: name,
                subtitle: member?['ministry']?.toString(),
                leading: const CircleAvatar(child: Icon(Icons.person)),
              ),
              const SizedBox(height: 16),
              _NavTile(
                icon: Icons.calendar_month,
                title: l10n.nav_calendar,
                route: AppRouter.calendar,
              ),
              _NavTile(
                icon: Icons.fact_check,
                title: l10n.nav_attendance,
                route: AppRouter.attendance,
              ),
              _NavTile(
                icon: Icons.swap_horiz,
                title: l10n.nav_swaps,
                route: AppRouter.swaps,
              ),
              _NavTile(
                icon: Icons.person_add,
                title: l10n.nav_replacements,
                route: AppRouter.replacements,
              ),
              _NavTile(
                icon: Icons.notifications,
                title: l10n.nav_notifications,
                route: AppRouter.notifications,
              ),
              _NavTile(
                icon: Icons.gavel,
                title: l10n.nav_discipline,
                route: AppRouter.discipline,
              ),
              if (member?['ministry'] == 'CHOIR')
                _NavTile(
                  icon: Icons.account_balance_wallet,
                  title: l10n.nav_finance,
                  route: AppRouter.finance,
                ),
            ],
          ),
        ),
      ),
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
