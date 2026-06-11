import '../../features/auth/providers/auth_provider.dart';

String shellUserLabel(AuthState auth) {
  final member = auth.profile?['member'] as Map<String, dynamic>?;
  final firstName = member?['firstName']?.toString();
  final lastName = member?['lastName']?.toString();
  final fullName = [firstName, lastName]
      .whereType<String>()
      .where((value) => value.isNotEmpty)
      .join(' ');
  if (fullName.isNotEmpty) return fullName;
  return auth.profile?['email']?.toString() ?? 'CMMS User';
}

String shellUserInitials(AuthState auth) {
  final label = shellUserLabel(auth);
  final parts = label.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty) return 'U';
  if (parts.length == 1) {
    return parts.first[0].toUpperCase();
  }
  return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
}

String shellUserRole(AuthState auth) {
  if (auth.roleNames.isEmpty) return 'Member';
  return auth.roleNames.join(' · ');
}
