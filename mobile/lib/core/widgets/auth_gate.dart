import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';

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

    return child;
  }
}
