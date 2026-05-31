import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../localization/l10n.dart';
import '../widgets/auth_gate.dart';
import '../widgets/app_shell.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/signup_screen.dart';
import '../../features/auth/screens/pending_approval_screen.dart';
import '../../features/dashboard/screens/leader_dashboard_screen.dart';
import '../../features/dashboard/screens/member_dashboard_screen.dart';
import '../../features/dashboard/screens/operational_dashboard_screen.dart';
import '../../features/events/screens/event_calendar_screen.dart';
import '../../features/attendance/screens/attendance_screen.dart';
import '../../features/swaps/screens/swap_list_screen.dart';
import '../../features/replacements/screens/replacement_screen.dart';
import '../../features/discipline/screens/discipline_screen.dart';
import '../../features/finance/screens/finance_screen.dart';
import '../../features/sync/screens/sync_status_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/assignments/screens/leader_assignment_screen.dart';
import '../../features/choir/screens/choir_rotation_screen.dart';
import '../../features/finance/screens/budget_screen.dart';
import '../../features/finance/screens/my_contributions_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../../features/settings/screens/language_settings_screen.dart';
import '../../features/coverage/screens/coverage_screen.dart';
import '../../features/members/screens/members_screen.dart';

class AppRouter {
  static const splash = '/';
  static const login = '/login';
  static const signup = '/signup';
  static const pendingApproval = '/pending-approval';
  static const notFound = '/404';
  static const memberDashboard = '/member';
  static const leaderDashboard = '/leader';
  static const operational = '/operational';
  static const calendar = '/calendar';
  static const attendance = '/attendance';
  static const coverage = '/coverage';
  static const swaps = '/swaps';
  static const replacements = '/replacements';
  static const discipline = '/discipline';
  static const finance = '/finance';
  static const sync = '/sync';
  static const notifications = '/notifications';
  static const assignments = '/assignments';
  static const choirRotation = '/choir-rotation';
  static const budgets = '/budgets';
  static const myContributions = '/my-contributions';
  static const members = '/members';
  static const settings = '/settings';
  static const language = '/settings/language';

  static final Set<String> _knownRoutes = {
    splash,
    login,
    signup,
    pendingApproval,
    notFound,
    memberDashboard,
    leaderDashboard,
    operational,
    calendar,
    attendance,
    coverage,
    swaps,
    replacements,
    discipline,
    finance,
    sync,
    notifications,
    assignments,
    choirRotation,
    budgets,
    myContributions,
    members,
    settings,
    language,
  };

  static String initialRouteForPlatform() {
    if (!kIsWeb) return login;

    final rawPath = Uri.base.path;
    final normalized = _normalizePath(rawPath.isEmpty ? splash : rawPath);
    if (normalized == splash) {
      return login;
    }

    return normalized;
  }

  static String postLoginRoute(
    AuthState auth, {
    String? redirectRoute,
  }) {
    if (auth.isPendingApproval) {
      return pendingApproval;
    }

    final normalized = redirectRoute == null ? null : _normalizePath(redirectRoute);
    if (normalized != null &&
        normalized != login &&
        _knownRoutes.contains(normalized)) {
      return normalized;
    }

    return auth.isLeader ? leaderDashboard : memberDashboard;
  }

  static bool requiresAuth(String routeName) =>
      routeName != login &&
      routeName != signup &&
      routeName != notFound;

  static List<Route<dynamic>> generateInitialRoutes(String initialRouteName) {
    return [
      onGenerateRoute(RouteSettings(name: initialRouteName)),
    ];
  }

  static String pageTitle(
    BuildContext context,
    String routeName,
  ) {
    final l10n = context.l10n;
    switch (routeName) {
      case login:
        return l10n.auth_sign_in_action;
      case signup:
        return l10n.onboarding_signup_title;
      case pendingApproval:
        return l10n.onboarding_pending_title;
      case notFound:
        return l10n.error_not_found;
      case memberDashboard:
        return l10n.dashboard_member_title;
      case leaderDashboard:
        return l10n.dashboard_leader_title;
      case operational:
        return l10n.operational_title;
      case calendar:
        return l10n.nav_calendar;
      case attendance:
        return l10n.nav_attendance;
      case coverage:
        return l10n.nav_coverage;
      case swaps:
        return l10n.nav_swaps;
      case replacements:
        return l10n.nav_replacements;
      case discipline:
        return l10n.nav_discipline;
      case finance:
        return l10n.nav_finance;
      case sync:
        return l10n.sync_title;
      case notifications:
        return l10n.notifications_title;
      case assignments:
        return l10n.assignments_title;
      case choirRotation:
        return l10n.choir_rotation_title;
      case budgets:
        return l10n.budgets_title;
      case myContributions:
        return l10n.my_contributions_title;
      case members:
        return l10n.members_title;
      case settings:
        return l10n.settings_title;
      case language:
        return l10n.settings_language_title;
      default:
        return l10n.app_title;
    }
  }

  static String documentTitle(BuildContext context, String routeName) {
    final page = pageTitle(context, routeName);
    final app = context.l10n.app_title;
    if (page == app) return app;
    return '$page | $app';
  }

  static String _normalizePath(String path) {
    if (path.isEmpty || path == splash) return splash;
    var value = path;
    if (!value.startsWith('/')) {
      value = '/$value';
    }
    if (value.length > 1 && value.endsWith('/')) {
      value = value.substring(0, value.length - 1);
    }
    return value;
  }

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case login:
        return _page(const LoginScreen(), routeName: login);
      case signup:
        return _page(const SignupScreen(), routeName: signup);
      case pendingApproval:
        return _page(const PendingApprovalScreen(), routeName: pendingApproval);
      case memberDashboard:
        return _page(const MemberDashboardScreen(), routeName: memberDashboard);
      case leaderDashboard:
        return _page(const LeaderDashboardScreen(), routeName: leaderDashboard);
      case operational:
        return _page(const OperationalDashboardScreen(), routeName: operational);
      case calendar:
        return _page(const EventCalendarScreen(), routeName: calendar);
      case attendance:
        return _page(const AttendanceScreen(), routeName: attendance);
      case coverage:
        return _page(const CoverageScreen(), routeName: coverage);
      case swaps:
        return _page(const SwapListScreen(), routeName: swaps);
      case replacements:
        return _page(const ReplacementScreen(), routeName: replacements);
      case discipline:
        return _page(const DisciplineScreen(), routeName: discipline);
      case finance:
        return _page(const FinanceScreen(), routeName: finance);
      case sync:
        return _page(const SyncStatusScreen(), routeName: sync);
      case notifications:
        return _page(const NotificationsScreen(), routeName: notifications);
      case assignments:
        return _page(const LeaderAssignmentScreen(), routeName: assignments);
      case choirRotation:
        return _page(const ChoirRotationScreen(), routeName: choirRotation);
      case budgets:
        return _page(const BudgetScreen(), routeName: budgets);
      case myContributions:
        return _page(const MyContributionsScreen(), routeName: myContributions);
      case members:
        return _page(const MembersScreen(), routeName: members);
      case settings:
        return _page(const SettingsScreen(), routeName: settings);
      case language:
        return _page(const LanguageSettingsScreen(), routeName: language);
      default:
        return _page(
          _NotFoundPage(requestedRoute: settings.name?.toString()),
          routeName: notFound,
          requestedRoute: settings.name?.toString(),
        );
    }
  }

  static MaterialPageRoute _page(
    Widget child, {
    required String routeName,
    String? requestedRoute,
  }) {
    return MaterialPageRoute(
      builder: (context) {
        Widget page = child;

        if (requiresAuth(routeName)) {
          page = AuthGate(routeName: routeName, child: page);
        }

        if (AppShell.shouldWrap(routeName) || routeName == notFound) {
          page = AppShell(currentRoute: routeName, child: page);
        }

        return Title(
          title: documentTitle(context, routeName),
          color: Theme.of(context).colorScheme.primary,
          child: page,
        );
      },
      settings: RouteSettings(name: requestedRoute ?? routeName),
    );
  }
}

class _NotFoundPage extends ConsumerWidget {
  const _NotFoundPage({
    this.requestedRoute,
  });

  final String? requestedRoute;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final destination = auth.isAuthenticated
        ? AppRouter.postLoginRoute(auth)
        : AppRouter.login;
    final destinationLabel = AppRouter.pageTitle(context, destination);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.search_off,
                    size: 72,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n.error_not_found,
                    style: Theme.of(context).textTheme.headlineMedium,
                    textAlign: TextAlign.center,
                  ),
                  if (requestedRoute != null &&
                      requestedRoute!.isNotEmpty &&
                      requestedRoute != AppRouter.notFound) ...[
                    const SizedBox(height: 12),
                    Text(
                      requestedRoute!,
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                  ],
                  const SizedBox(height: 24),
                  FilledButton.icon(
                    onPressed: () => Navigator.pushNamedAndRemoveUntil(
                      context,
                      destination,
                      (_) => false,
                    ),
                    icon: const Icon(Icons.home_outlined),
                    label: Text(destinationLabel),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
