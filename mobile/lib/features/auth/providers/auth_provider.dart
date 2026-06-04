import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_response.dart';
import '../../../core/localization/api_error_localizer.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../../core/auth/governance_permissions.dart' as gov;

class AuthState {
  const AuthState({
    this.initialized = false,
    this.loading = false,
    this.profile,
    this.errorCode,
    this.errorMessage,
    this.sessionExpired = false,
  });

  final bool initialized;
  final bool loading;
  final Map<String, dynamic>? profile;
  final String? errorCode;
  final String? errorMessage;
  final bool sessionExpired;

  bool get isAuthenticated => profile != null;
  String? get userId => profile?['id'] as String?;

  String? get memberStatus =>
      profile?['member']?['status'] as String? ??
      profile?['member']?['status']?.toString();

  bool get isPendingApproval => memberStatus == 'PENDING';

  bool get needsOnboardingWelcome {
    if (!isAuthenticated || isPendingApproval) return false;
    final completed = profile?['onboardingCompleted'] == true ||
        profile?['member']?['onboardingCompleted'] == true;
    return !completed;
  }

  List<String> get permissions {
    final raw = profile?['permissions'] as List?;
    if (raw == null) return const [];
    return raw.map((e) => e.toString()).toList();
  }

  String? get memberNumber =>
      profile?['member']?['memberNumber']?.toString();

  List<String> get roleNames {
    final fromApi = profile?['roles'] as List?;
    if (fromApi != null) {
      return fromApi.map((e) => e.toString()).toList();
    }
    final roles = profile?['userRoles'] as List?;
    if (roles == null) return const [];
    return roles
        .map((r) => (r as Map)['role']?['name'] as String?)
        .whereType<String>()
        .toList();
  }

  bool hasPermission(String code) =>
      gov.hasEffectivePermission(permissions, code);

  bool get hasOperationalLeaderDashboard =>
      gov.hasOperationalLeaderDashboard(permissions);

  bool get hasPlatformAdminAccess =>
      gov.hasPlatformAdminAccess(permissions);

  bool get canViewAdminAudit => gov.canViewAdminAudit(permissions);

  bool get canManageAdminSync => gov.canManageAdminSync(permissions);

  bool get canAccessLeaderDashboard =>
      gov.canAccessLeaderDashboard(permissions);

  bool get isStaff => canAccessLeaderDashboard;

  bool get isLeader => isStaff;
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._api, this._localeNotifier) : super(const AuthState()) {
    bootstrap();
  }

  final ApiClient _api;
  final LocaleNotifier _localeNotifier;

  Future<void> bootstrap() async {
    await _api.loadToken();
    try {
      final res = await _api.dio.get('/auth/me');
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      if (parsed.success && parsed.data != null) {
        state = AuthState(
          initialized: true,
          profile: parsed.data,
        );
        await _localeNotifier.syncFromProfile(
          parsed.data!['preferredLanguage'] as String?,
        );
        return;
      }
    } catch (_) {
      final refreshed = await _api.refreshAccessToken();
      if (refreshed != null) {
        return bootstrap();
      }
    }
    state = const AuthState(initialized: true);
  }

  Future<bool> login(String email, String password) async {
    state = AuthState(initialized: true, loading: true);
    try {
      final res = await _api.dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      if (!parsed.success || parsed.data == null) {
        state = AuthState(
          initialized: true,
          errorCode: parsed.error?.code,
          errorMessage: parsed.error?.message,
        );
        return false;
      }
      await _applySession(parsed.data!);
      return state.isAuthenticated;
    } catch (e) {
      state = AuthState(
        initialized: true,
        errorMessage: e.toString(),
      );
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
    String ministry = 'CHOIR',
    String? preferredLanguage,
  }) async {
    state = AuthState(initialized: true, loading: true);
    try {
      final res = await _api.dio.post(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'firstName': firstName,
          'lastName': lastName,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
          'ministry': ministry,
          if (preferredLanguage != null) 'preferredLanguage': preferredLanguage,
        },
      );
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      if (!parsed.success || parsed.data == null) {
        state = AuthState(
          initialized: true,
          errorCode: parsed.error?.code,
          errorMessage: parsed.error?.message,
        );
        return false;
      }
      await _applySession(parsed.data!);
      return state.isAuthenticated;
    } catch (e) {
      state = AuthState(
        initialized: true,
        errorMessage: e.toString(),
      );
      return false;
    }
  }

  Future<void> completeOnboarding() async {
    await _api.dio.patch('/auth/onboarding-complete');
    if (state.profile == null) return;
    final profile = Map<String, dynamic>.from(state.profile!);
    profile['onboardingCompleted'] = true;
    final member = profile['member'];
    if (member is Map<String, dynamic>) {
      profile['member'] = {
        ...member,
        'onboardingCompleted': true,
      };
    }
    state = AuthState(
      initialized: true,
      profile: profile,
    );
  }

  Future<void> logout() async {
    await _api.logoutRemote();
    state = const AuthState(initialized: true);
  }

  Future<void> _applySession(Map<String, dynamic> session) async {
    await _api.setToken(session['accessToken'] as String);
    final refreshToken = session['refreshToken'] as String?;
    if (refreshToken != null) {
      await _api.setRefreshToken(refreshToken);
    }
    await bootstrap();
  }

  String localizedError(AppLocalizations l10n) {
    return ApiErrorLocalizer.resolve(
      l10n,
      serverMessage: state.errorMessage,
      code: state.errorCode,
    );
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(apiClientProvider),
    ref.read(localeProvider.notifier),
  );
});
