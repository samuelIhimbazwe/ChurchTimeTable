import '../../l10n/generated/app_localizations.dart';

class ApiErrorLocalizer {
  static String fromCode(AppLocalizations l10n, String code) {
    switch (code) {
      case 'CONFLICT':
        return l10n.error_conflict;
      case 'UNAUTHORIZED':
        return l10n.error_unauthorized;
      case 'FORBIDDEN':
        return l10n.error_forbidden;
      case 'NOT_FOUND':
        return l10n.error_not_found;
      case 'VALIDATION_ERROR':
      case 'BAD_REQUEST':
        return l10n.error_validation;
      case 'BUSINESS_RULE_VIOLATION':
        return l10n.error_business_rule;
      default:
        return l10n.error_unknown;
    }
  }

  /// Prefer server-localized message; fall back to client catalog by code.
  static String resolve(
    AppLocalizations l10n, {
    required String? serverMessage,
    required String? code,
  }) {
    if (serverMessage != null && serverMessage.trim().isNotEmpty) {
      return serverMessage;
    }
    if (code != null) return fromCode(l10n, code);
    return l10n.error_unknown;
  }
}
