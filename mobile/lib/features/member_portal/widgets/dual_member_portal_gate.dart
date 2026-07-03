import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/portal/dual_member_portal_access.dart';
import '../providers/member_portal_providers.dart';

/// Redirects non–dual members away from the member portal.
class DualMemberPortalGate extends ConsumerStatefulWidget {
  const DualMemberPortalGate({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<DualMemberPortalGate> createState() =>
      _DualMemberPortalGateState();
}

class _DualMemberPortalGateState extends ConsumerState<DualMemberPortalGate> {
  bool _redirected = false;

  @override
  Widget build(BuildContext context) {
    final homeAsync = ref.watch(memberPortalHomeProvider);

    return homeAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => widget.child,
      data: (data) {
        final access = DualMemberPortalAccess.fromHomeData(data);
        if (!access.canAccessPortal && !_redirected) {
          _redirected = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) return;
            final route = access.resolveRedirectRoute();
            final args = access.resolveRedirectArguments();
            Navigator.of(context).pushNamedAndRemoveUntil(
              route,
              (r) => r.isFirst,
              arguments: args,
            );
          });
          return const Scaffold(
            body: Center(child: Text('Redirecting…')),
          );
        }
        if (!access.canAccessPortal) {
          return const Scaffold(
            body: Center(child: Text('Redirecting…')),
          );
        }
        return widget.child;
      },
    );
  }
}
