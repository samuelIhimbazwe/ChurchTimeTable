import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:cmms_mobile/l10n/generated/app_localizations.dart';
import 'package:cmms_mobile/core/localization/church_localization.dart';

Widget _app(Widget child, Locale locale) {
  return MaterialApp(
    locale: locale,
    supportedLocales: AppLocalizations.supportedLocales,
    localizationsDelegates: const [
      AppLocalizations.delegate,
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
    ],
    home: Scaffold(body: child),
  );
}

void main() {
  group('Translation loading', () {
    for (final locale in AppLocalizations.supportedLocales) {
      testWidgets('loads ${locale.languageCode}', (tester) async {
        late AppLocalizations l10n;
        await tester.pumpWidget(
          _app(
            Builder(
              builder: (context) {
                l10n = AppLocalizations.of(context)!;
                return const SizedBox();
              },
            ),
            locale,
          ),
        );
        expect(l10n.nav_attendance, isNotEmpty);
      });
    }
  });

  group('Placeholder rendering', () {
    testWidgets('swap_request_sent interpolates memberName (rw)', (tester) async {
      await tester.pumpWidget(
        _app(
          Builder(
            builder: (context) =>
                Text(context.l10n.swap_request_sent('Jean Baptiste')),
          ),
          const Locale('rw'),
        ),
      );
      expect(find.textContaining('Jean Baptiste'), findsOneWidget);
      expect(find.textContaining('{memberName}'), findsNothing);
    });

    testWidgets('sync_result_applied interpolates counts (en)', (tester) async {
      await tester.pumpWidget(
        _app(
          Builder(
            builder: (context) => Text(context.l10n.sync_result_applied(2, 1)),
          ),
          const Locale('en'),
        ),
      );
      expect(find.textContaining('Applied: 2'), findsOneWidget);
    });
  });

  group('Enum localization mapping', () {
    test('swap statuses are church-native in Kinyarwanda', () {
      final l10n = AppLocalizations(const Locale('rw'));
      expect(l10n.swapStatusLabel('LEADER_PENDING'), 'Bitegereje umuyobozi');
      expect(l10n.swapStatusLabel('UNKNOWN'), 'Ntibisobanutse');
    });

    test('discipline stages localized in English', () {
      final l10n = AppLocalizations(const Locale('en'));
      expect(l10n.disciplineStageLabel('UNDER_REVIEW'), 'Under review');
    });
  });

  group('Locale switching', () {
    testWidgets('updates nav_attendance label when locale changes', (tester) async {
      await tester.pumpWidget(
        _app(
          Builder((context) => Text(context.l10n.nav_attendance)),
          const Locale('rw'),
        ),
      );
      expect(find.text('Uko witabiriye'), findsOneWidget);

      await tester.pumpWidget(
        _app(
          Builder((context) => Text(context.l10n.nav_attendance)),
          const Locale('en'),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Attendance'), findsOneWidget);
    });
  });

  group('Overflow-safe multilingual labels', () {
    testWidgets('French long label in narrow width has no layout exception',
        (tester) async {
      await tester.pumpWidget(
        _app(
          Center(
            child: SizedBox(
              width: 100,
              child: Builder(
                builder: (context) => Text(
                  context.l10n.swap_leader_approve_action,
                  softWrap: true,
                ),
              ),
            ),
          ),
          const Locale('fr'),
        ),
      );
      expect(tester.takeException(), isNull);
    });
  });
}
