import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/pending_approval_screen.dart';
import '../localization/l10n.dart';
import '../routing/app_router.dart';
import '../routing/route_permissions.dart';
import '../auth/phone_enforcement.dart';

class AuthGate extends ConsumerWidget {
  const AuthGate({
    super.key,
    required this.routeName,
    required this.child,
  });

  final String routeName;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    if (!auth.initialized) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (!auth.isAuthenticated) {
      return LoginScreen(redirectRoute: routeName);
    }

    if (auth.isPendingApproval) {
      return const PendingApprovalScreen();
    }

    if (!canAccessRoute(routeName, auth.permissions, profile: auth.profile)) {
      return _UnauthorizedRoutePage(routeName: routeName);
    }

    if (!canAccessRouteWithPhoneEnforcement(routeName, auth.profile)) {
      return _PhoneEnforcementBlockedPage(routeName: routeName);
    }

    return child;
  }
}

class _PhoneEnforcementBlockedPage extends ConsumerStatefulWidget {
  const _PhoneEnforcementBlockedPage({required this.routeName});

  final String routeName;

  @override
  ConsumerState<_PhoneEnforcementBlockedPage> createState() =>
      _PhoneEnforcementBlockedPageState();
}

class _PhoneEnforcementBlockedPageState
    extends ConsumerState<_PhoneEnforcementBlockedPage> {
  bool _redirectScheduled = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_redirectScheduled) return;
    _redirectScheduled = true;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      Navigator.of(context).pushNamedAndRemoveUntil(
        phoneEnforcementRedirectRoute(),
        (_) => false,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.phone_android_outlined,
                    size: 48,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n.phoneRequired,
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.restrictedUntilPhoneAdded,
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
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

class _UnauthorizedRoutePage extends ConsumerStatefulWidget {
  const _UnauthorizedRoutePage({required this.routeName});

  final String routeName;

  @override
  ConsumerState<_UnauthorizedRoutePage> createState() =>
      _UnauthorizedRoutePageState();
}

class _UnauthorizedRoutePageState extends ConsumerState<_UnauthorizedRoutePage> {
  bool _redirectScheduled = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_redirectScheduled) return;
    _redirectScheduled = true;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final auth = ref.read(authProvider);
      final destination = dashboardRouteForPermissions(auth.permissions);
      Navigator.of(context).pushNamedAndRemoveUntil(
        destination,
        (_) => false,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.lock_outline,
                    size: 48,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'You do not have permission to access this page.',
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.error_forbidden,
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
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
