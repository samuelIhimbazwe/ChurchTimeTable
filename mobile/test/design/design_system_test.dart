import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:cmms_mobile/core/design/components/buttons/cmms_button.dart';
import 'package:cmms_mobile/core/design/components/chips/cmms_chip.dart';
import 'package:cmms_mobile/core/design/theme/app_theme.dart';
import 'package:cmms_mobile/l10n/generated/app_localizations.dart';

Widget _harness(Widget child, {Locale locale = const Locale('fr')}) {
  return MaterialApp(
    locale: locale,
    theme: AppTheme.light,
    darkTheme: AppTheme.dark,
    supportedLocales: AppLocalizations.supportedLocales,
    localizationsDelegates: const [
      AppLocalizations.delegate,
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
    ],
    home: Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: child,
        ),
      ),
    ),
  );
}

void main() {
  group('CmmsButton multiline / French overflow', () {
    testWidgets('long French label does not overflow at narrow width',
        (tester) async {
      await tester.pumpWidget(
        _harness(
          const SizedBox(
            width: 110,
            child: CmmsButton(
              label:
                  "Approuver (responsable) pour l'échange de service",
              onPressed: null,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });

    testWidgets('Kinyarwanda label wraps', (tester) async {
      await tester.pumpWidget(
        _harness(
          const SizedBox(
            width: 120,
            child: CmmsButton(
              label: 'Emera n\'umuyobozi guhindurana',
              onPressed: null,
            ),
          ),
          locale: const Locale('rw'),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });

  group('CmmsChip expansion', () {
    testWidgets('chip wraps long text', (tester) async {
      await tester.pumpWidget(
        _harness(
          const SizedBox(
            width: 90,
            child: CmmsChip(
              label: 'En attente du responsable',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });

  group('Accessibility / text scaling', () {
    testWidgets('large text scale remains layed out', (tester) async {
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(textScaler: TextScaler.linear(1.4)),
          child: _harness(
            Builder(
              builder: (context) => CmmsButton(
                label: AppLocalizations.of(context)!.swap_leader_approve_action,
                onPressed: () {},
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });

  group('Dark theme', () {
    testWidgets('renders CmmsButton in dark mode', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light,
          darkTheme: AppTheme.dark,
          themeMode: ThemeMode.dark,
          home: const Scaffold(
            body: CmmsButton(label: 'Test', onPressed: null),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });
}
