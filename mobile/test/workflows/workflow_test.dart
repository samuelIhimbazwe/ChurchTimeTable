import 'package:flutter_test/flutter_test.dart';
import 'package:cmms_mobile/core/localization/church_localization.dart';
import 'package:cmms_mobile/l10n/generated/app_localizations.dart';

void main() {
  group('Workflow localization', () {
    test('event types localized in Kinyarwanda', () {
      final l10n = AppLocalizations(const Locale('rw'));
      expect(l10n.eventTypeLabel('CHOIR_SERVICE'), isNotEmpty);
      expect(l10n.eventTypeLabel('PROTOCOL_SERVICE'), isNotEmpty);
    });

    test('swap statuses localized in English', () {
      final l10n = AppLocalizations(const Locale('en'));
      expect(l10n.swapStatusLabel('LEADER_PENDING'), isNotEmpty);
    });

    test('attendance physical labels in French', () {
      final l10n = AppLocalizations(const Locale('fr'));
      expect(l10n.attendancePhysicalStatusLabel('PRESENT'), isNotEmpty);
    });
  });

  group('Assignment validation messages', () {
    test('conflict warning keys exist all locales', () {
      for (final code in ['rw', 'en', 'fr']) {
        final l10n = AppLocalizations(Locale(code));
        expect(l10n.assignment_conflict_warning, isNotEmpty);
        expect(l10n.assignment_validate_action, isNotEmpty);
      }
    });
  });

  group('Dashboard KPI keys', () {
    test('leader KPI strings non-empty', () {
      final l10n = AppLocalizations(const Locale('rw'));
      expect(l10n.dashboard_kpi_upcoming_events, isNotEmpty);
      expect(l10n.dashboard_kpi_attendance_rate, isNotEmpty);
    });
  });
}
