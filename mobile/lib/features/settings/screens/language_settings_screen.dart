import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/localization/locale_provider.dart';
import '../../auth/providers/auth_provider.dart';

class LanguageSettingsScreen extends ConsumerWidget {
  const LanguageSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final locale = ref.watch(localeProvider);
    final userId = ref.watch(authProvider).userId;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.settings_language_title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            l10n.settings_language_subtitle,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          _LanguageTile(
            label: l10n.language_kinyarwanda,
            code: 'rw',
            groupValue: locale.languageCode,
            onSelect: (code) => _select(ref, userId, code),
          ),
          _LanguageTile(
            label: l10n.language_english,
            code: 'en',
            groupValue: locale.languageCode,
            onSelect: (code) => _select(ref, userId, code),
          ),
          _LanguageTile(
            label: l10n.language_french,
            code: 'fr',
            groupValue: locale.languageCode,
            onSelect: (code) => _select(ref, userId, code),
          ),
        ],
      ),
    );
  }

  Future<void> _select(
    WidgetRef ref,
    String? userId,
    String code,
  ) async {
    await ref.read(localeProvider.notifier).setLocale(
          Locale(code),
          userId: userId,
        );
    if (ref.context.mounted) {
      ScaffoldMessenger.of(ref.context).showSnackBar(
        SnackBar(content: Text(ref.context.l10n.language_changed_success)),
      );
    }
  }
}

class _LanguageTile extends StatelessWidget {
  const _LanguageTile({
    required this.label,
    required this.code,
    required this.groupValue,
    required this.onSelect,
  });

  final String label;
  final String code;
  final String groupValue;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return RadioListTile<String>(
      title: Text(label, softWrap: true),
      value: code,
      groupValue: groupValue,
      onChanged: (_) => onSelect(code),
    );
  }
}
