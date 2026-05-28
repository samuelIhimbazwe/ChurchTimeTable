import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_response.dart';
import '../../../core/localization/api_error_localizer.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../l10n/generated/app_localizations.dart';

class AuthState {
  const AuthState({
    this.initialized = false,
    this.loading = false,
    this.profile,
    this.errorCode,
    this.errorMessage,
  });

  final bool initialized;
  final bool loading;
  final Map<String, dynamic>? profile;
  final String? errorCode;
  final String? errorMessage;

  bool get isAuthenticated => profile != null;
  String? get userId => profile?['id'] as String?;

  List<String> get permissions {
    final raw = profile?['permissions'] as List?;
    if (raw == null) return const [];
    return raw.map((e) => e.toString()).toList();
  }

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

  bool hasPermission(String code) => permissions.contains(code);

  /// Staff / officer dashboard (president, secretary, treasurer, leaders, admin).
  bool get isStaff {
    if (hasPermission('event:write') ||
        hasPermission('assignment:write') ||
        hasPermission('attendance:write') ||
        hasPermission('swap:manage') ||
        hasPermission('finance:write') ||
        hasPermission('report:export') ||
        hasPermission('discipline:manage')) {
      return true;
    }
    return roleNames.any(
      (name) =>
          name.contains('LEADER') ||
          name.contains('ADMIN') ||
          name.contains('PRESIDENT') ||
          name.contains('SECRETARY') ||
          name.contains('TREASURER') ||
          name.contains('COMMITTEE') ||
          name.contains('LOGISTICS') ||
          name.contains('REHEARSAL'),
    );
  }

  /// @deprecated Use [isStaff] — kept for existing screens.
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
      // Fall through to initialized unauthenticated state.
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
      await _api.setToken(parsed.data!['accessToken'] as String);
      await bootstrap();
      return state.isAuthenticated;
    } catch (e) {
      state = AuthState(
        initialized: true,
        errorMessage: e.toString(),
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _api.setToken(null);
    state = const AuthState(initialized: true);
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
