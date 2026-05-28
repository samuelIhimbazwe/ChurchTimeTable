import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/layout/adaptive_spacing.dart';
import '../../../core/design/theme/theme_mode_provider.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/routing/app_router.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final themeMode = ref.watch(themeModeProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.settings_title)),
      body: ListView(
        padding: AdaptiveSpacing.screen(context),
        children: [
          CmmsCard(
            title: l10n.settings_language_title,
            subtitle: l10n.settings_language_subtitle,
            leading: const Icon(Icons.language),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.pushNamed(context, AppRouter.language),
          ),
          const SizedBox(height: 16),
          Text(
            l10n.settings_appearance_title,
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: 8),
          _ThemeTile(
            label: l10n.settings_theme_system,
            mode: ThemeMode.system,
            group: themeMode,
            onSelect: (m) => ref.read(themeModeProvider.notifier).setMode(m),
          ),
          _ThemeTile(
            label: l10n.settings_theme_light,
            mode: ThemeMode.light,
            group: themeMode,
            onSelect: (m) => ref.read(themeModeProvider.notifier).setMode(m),
          ),
          _ThemeTile(
            label: l10n.settings_theme_dark,
            mode: ThemeMode.dark,
            group: themeMode,
            onSelect: (m) => ref.read(themeModeProvider.notifier).setMode(m),
          ),
        ],
      ),
    );
  }
}

class _ThemeTile extends StatelessWidget {
  const _ThemeTile({
    required this.label,
    required this.mode,
    required this.group,
    required this.onSelect,
  });

  final String label;
  final ThemeMode mode;
  final ThemeMode group;
  final ValueChanged<ThemeMode> onSelect;

  @override
  Widget build(BuildContext context) {
    return RadioListTile<ThemeMode>(
      title: Text(label, softWrap: true),
      value: mode,
      groupValue: group,
      onChanged: (_) => onSelect(mode),
    );
  }
}
