import 'package:flutter_test/flutter_test.dart';
import 'package:cmms_mobile/l10n/generated/app_localizations.dart';

/// Mirrors backend notification placeholder contracts (see backend i18n messages).
void main() {
  group('Notification-style interpolation (client catalog)', () {
    test('attendance_marked_for_event all locales', () {
      for (final code in ['rw', 'en', 'fr']) {
        final l10n = AppLocalizations(Locale(code));
        final msg = l10n.attendance_marked_for_event('Iteraniro rya Sunday');
        expect(msg, contains('Iteraniro rya Sunday'));
        expect(msg, isNot(contains('{eventName}')));
      }
    });

    test('discipline_case_opened all locales', () {
      for (final code in ['rw', 'en', 'fr']) {
        final l10n = AppLocalizations(Locale(code));
        final msg = l10n.discipline_case_opened('Impinduka');
        expect(msg, contains('Impinduka'));
      }
    });

    test('dues_remaining all locales', () {
      for (final code in ['rw', 'en', 'fr']) {
        final l10n = AppLocalizations(Locale(code));
        final msg = l10n.dues_remaining('5,000 RWF');
        expect(msg, contains('5,000 RWF'));
      }
    });
  });
}
