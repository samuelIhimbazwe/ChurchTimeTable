import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'firebase_options.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'core/design/theme/app_theme.dart';
import 'core/design/theme/theme_mode_provider.dart';
import 'core/routing/app_router.dart';
import 'core/services/fcm_service.dart';
import 'core/localization/locale_provider.dart';
import 'l10n/generated/app_localizations.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (kIsWeb) {
    usePathUrlStrategy();
  }
  await Hive.initFlutter();
  await Hive.openBox('sync_queue');
  await Hive.openBox('cache');

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    await FcmService().initialize();
  } catch (e) {
    debugPrint('Firebase init skipped: $e');
  }

  runApp(const ProviderScope(child: CmmsApp()));
}

class CmmsApp extends ConsumerWidget {
  const CmmsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp(
      title: 'CMMS',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      localeResolutionCallback: (deviceLocale, supported) {
        if (deviceLocale != null) {
          for (final s in supported) {
            if (s.languageCode == deviceLocale.languageCode) return s;
          }
        }
        return const Locale('rw');
      },
      onGenerateRoute: AppRouter.onGenerateRoute,
      initialRoute: AppRouter.initialRouteForPlatform(),
      onGenerateInitialRoutes: AppRouter.generateInitialRoutes,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: MediaQuery.textScalerOf(context).clamp(
              minScaleFactor: 0.9,
              maxScaleFactor: 1.4,
            ),
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
