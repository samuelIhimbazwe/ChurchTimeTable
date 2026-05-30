import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/governance_permissions.dart';
import '../../auth/providers/auth_provider.dart';
import 'attendance_governance_screen.dart';
import 'member_attendance_screen.dart';

/// Routes members to self-service attendance and leaders to governance marking.
class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (canMarkAttendance(auth.permissions) ||
        hasProtocolTeamHead(auth.permissions)) {
      return const AttendanceGovernanceScreen();
    }
    return const MemberAttendanceScreen();
  }
}
