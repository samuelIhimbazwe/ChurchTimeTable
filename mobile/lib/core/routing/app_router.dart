import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
import '../../features/finance/screens/submit_contribution_screen.dart';
import '../../features/protocol/screens/protocol_contribute_screen.dart';
import '../../features/protocol/screens/protocol_treasury_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../../features/settings/screens/language_settings_screen.dart';
import '../../features/coverage/screens/coverage_screen.dart';
import '../../features/members/screens/members_screen.dart';
import '../../features/members/screens/member_profile_screen.dart';
import '../../features/families/screens/families_screen.dart';
import '../../features/ministries/screens/ministries_screen.dart';
import '../../features/ministries/screens/ministry_detail_screen.dart';
import '../../features/ministry_services/screens/ministry_services_screen.dart';
import '../../features/operational_units/screens/operational_units_screen.dart';
import '../../features/operational_units/screens/operational_unit_detail_screen.dart';
import '../../features/welfare/screens/welfare_screen.dart';
import '../../features/music/screens/music_screen.dart';
import '../../features/rehearsals/screens/rehearsals_screen.dart';
import '../../features/devotions/screens/devotion_center_screen.dart';
import '../../features/search/screens/search_screen.dart';
import '../../features/assets/screens/assets_screen.dart';
import '../../features/assets/screens/asset_detail_screen.dart';
import '../../features/ministry_finance/screens/ministry_finance_screen.dart';
import '../../features/church_intelligence/screens/church_intelligence_screen.dart';
import '../../features/operations/screens/operations_screen.dart';
import '../../features/protocol/screens/protocol_screen.dart';
import '../../features/protocol/screens/protocol_replacement_screen.dart';
import '../../features/member_portal/screens/member_home_screen.dart';
import '../../features/member_portal/screens/membership_center_screen.dart';
import '../../features/member_portal/screens/broadcast_center_screen.dart';
import '../../features/member_portal/screens/invitations_screen.dart';
import '../../features/member_portal/screens/requests_screen.dart';

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
  static const submitContribution = '/contributions/submit';
  static const protocolContribute = '/protocol/contribute';
  static const protocolTreasury = '/protocol/treasury';
  static const protocolReplacement = '/protocol/replacement';
  static const members = '/members';
  static const memberProfile = '/members/profile';
  static const myProfile = '/my-profile';
  static const families = '/families';
  static const ministries = '/ministries';
  static const ministryDetail = '/ministries/detail';
  static const ministryServices = '/ministries/services';
  static const ministryFinance = '/ministries/finance';
  static const operationalUnits = '/operational-units';
  static const operationalUnitDetail = '/operational-units/detail';
  static const welfare = '/welfare';
  static const music = '/music';
  static const rehearsals = '/rehearsals';
  static const devotions = '/devotions';
  static const search = '/search';
  static const assets = '/assets';
  static const assetDetail = '/assets/detail';
  static const churchIntelligence = '/church/intelligence';
  static const churchOperations = '/operations';
  static const protocolDashboard = '/protocol';
  static const memberPortalHome = '/member-portal';
  static const memberPortalMembership = '/member-portal/membership';
  static const memberPortalBroadcasts = '/member-portal/broadcasts';
  static const memberPortalInvitations = '/member-portal/invitations';
  static const memberPortalRequests = '/member-portal/requests';
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
    submitContribution,
    protocolContribute,
    protocolTreasury,
    protocolReplacement,
    members,
    memberProfile,
    myProfile,
    families,
    ministries,
    ministryDetail,
    ministryServices,
    operationalUnits,
    operationalUnitDetail,
    welfare,
    music,
    rehearsals,
    search,
    assets,
    assetDetail,
    ministryFinance,
    churchIntelligence,
    churchOperations,
    protocolDashboard,
    memberPortalHome,
    memberPortalMembership,
    memberPortalBroadcasts,
    memberPortalInvitations,
    memberPortalRequests,
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
      case submitContribution:
        return 'Submit contribution';
      case protocolContribute:
        return 'Protocol contribution';
      case protocolTreasury:
        return 'Protocol treasury';
      case protocolReplacement:
        return 'Protocol replacement';
      case members:
        return l10n.members_title;
      case memberProfile:
        return l10n.member_profile_title;
      case myProfile:
        return l10n.member_profile_title;
      case families:
        return l10n.families_title;
      case ministries:
        return l10n.ministries_title;
      case ministryDetail:
        return l10n.ministry_detail_title;
      case ministryFinance:
        return 'Ministry finance';
      case operationalUnits:
        return l10n.operational_units_title;
      case operationalUnitDetail:
        return l10n.operational_unit_detail_title;
      case welfare:
        return l10n.welfare_title;
      case music:
        return l10n.music_title;
      case rehearsals:
        return l10n.rehearsals_title;
      case devotions:
        return l10n.devotion_center_title;
      case search:
        return l10n.search_title;
      case assets:
        return 'Assets';
      case assetDetail:
        return 'Asset';
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

  static Route<dynamic> onGenerateRoute(RouteSettings routeSettings) {
    switch (routeSettings.name) {
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
      case submitContribution:
        return _page(
          const SubmitContributionScreen(),
          routeName: submitContribution,
        );
      case protocolContribute:
        return _page(
          const ProtocolContributeScreen(),
          routeName: protocolContribute,
        );
      case protocolTreasury:
        return _page(
          const ProtocolTreasuryScreen(),
          routeName: protocolTreasury,
        );
      case protocolReplacement:
        return _page(
          const ProtocolReplacementScreen(),
          routeName: protocolReplacement,
        );
      case members:
        return _page(const MembersScreen(), routeName: members);
      case memberProfile:
        final memberId = routeSettings.arguments as String?;
        if (memberId == null || memberId.isEmpty) {
          return _page(const MembersScreen(), routeName: members);
        }
        return _page(
          MemberProfileScreen(memberId: memberId),
          routeName: memberProfile,
        );
      case myProfile:
        return _page(const MyMemberProfileScreen(), routeName: myProfile);
      case families:
        return _page(const FamiliesScreen(), routeName: families);
      case assets:
        return _page(const AssetsScreen(), routeName: assets);
      case assetDetail:
        final assetId = routeSettings.arguments as String?;
        if (assetId == null || assetId.isEmpty) {
          return _page(const AssetsScreen(), routeName: assets);
        }
        return _page(
          AssetDetailScreen(assetId: assetId),
          routeName: assetDetail,
        );
      case churchIntelligence:
        return _page(
          const ChurchIntelligenceScreen(),
          routeName: churchIntelligence,
        );
      case churchOperations:
        return _page(
          const OperationsScreen(),
          routeName: churchOperations,
        );
      case protocolDashboard:
        return _page(
          const ProtocolScreen(),
          routeName: protocolDashboard,
        );
      case memberPortalHome:
        return _page(const MemberHomeScreen(), routeName: memberPortalHome);
      case memberPortalMembership:
        return _page(
          const MembershipCenterScreen(),
          routeName: memberPortalMembership,
        );
      case memberPortalBroadcasts:
        return _page(
          const BroadcastCenterScreen(),
          routeName: memberPortalBroadcasts,
        );
      case memberPortalInvitations:
        return _page(
          const MemberInvitationsScreen(),
          routeName: memberPortalInvitations,
        );
      case memberPortalRequests:
        return _page(
          const MemberRequestsScreen(),
          routeName: memberPortalRequests,
        );
      case ministries:
        return _page(const MinistriesScreen(), routeName: ministries);
      case ministryDetail:
        final ministryId = routeSettings.arguments as String?;
        if (ministryId == null || ministryId.isEmpty) {
          return _page(const MinistriesScreen(), routeName: ministries);
        }
        return _page(
          MinistryDetailScreen(ministryId: ministryId),
          routeName: ministryDetail,
        );
      case ministryServices:
        final ministryId = routeSettings.arguments as String?;
        if (ministryId == null || ministryId.isEmpty) {
          return _page(const MinistriesScreen(), routeName: ministries);
        }
        return _page(
          MinistryServicesScreen(ministryId: ministryId),
          routeName: ministryServices,
        );
      case ministryFinance:
        final ministryId = routeSettings.arguments as String?;
        if (ministryId == null || ministryId.isEmpty) {
          return _page(const MinistriesScreen(), routeName: ministries);
        }
        return _page(
          MinistryFinanceScreen(ministryId: ministryId),
          routeName: ministryFinance,
        );
      case operationalUnits:
        return _page(const OperationalUnitsScreen(), routeName: operationalUnits);
      case operationalUnitDetail:
        final unitId = routeSettings.arguments as String?;
        if (unitId == null || unitId.isEmpty) {
          return _page(const OperationalUnitsScreen(), routeName: operationalUnits);
        }
        return _page(
          OperationalUnitDetailScreen(unitId: unitId),
          routeName: operationalUnitDetail,
        );
      case welfare:
        return _page(const WelfareScreen(), routeName: welfare);
      case music:
        return _page(const MusicScreen(), routeName: music);
      case rehearsals:
        return _page(const RehearsalsScreen(), routeName: rehearsals);
      case devotions:
        return _page(const DevotionCenterScreen(), routeName: devotions);
      case search:
        return _page(const SearchScreen(), routeName: search);
      case settings:
        return _page(const SettingsScreen(), routeName: settings);
      case language:
        return _page(const LanguageSettingsScreen(), routeName: language);
      default:
        return _page(
          _NotFoundPage(requestedRoute: routeSettings.name?.toString()),
          routeName: notFound,
          requestedRoute: routeSettings.name?.toString(),
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
