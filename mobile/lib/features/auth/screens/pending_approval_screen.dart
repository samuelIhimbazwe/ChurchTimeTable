import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/routing/app_router.dart';
import '../providers/auth_provider.dart';

class PendingApprovalScreen extends ConsumerWidget {
  const PendingApprovalScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);
    final profile = auth.profile;
    final name = [
      profile?['member']?['firstName'],
      profile?['member']?['lastName'],
    ].whereType<String>().join(' ');

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: Theme.of(context).colorScheme.outlineVariant,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.onboarding_pending_eyebrow,
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                              color: Theme.of(context).colorScheme.primary,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        l10n.onboarding_pending_title,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      if (name.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          l10n.onboarding_pending_greeting(name),
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                      ],
                      const SizedBox(height: 16),
                      Text(
                        l10n.onboarding_pending_body,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 16),
                      Text('• ${l10n.onboarding_pending_step_review}'),
                      Text('• ${l10n.onboarding_pending_step_notify}'),
                      Text('• ${l10n.onboarding_pending_step_access}'),
                      const SizedBox(height: 16),
                      Text(
                        l10n.onboarding_pending_help,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: CmmsButton(
                          label: l10n.common_logout,
                          variant: CmmsButtonVariant.secondary,
                          onPressed: () async {
                            await ref.read(authProvider.notifier).logout();
                            if (!context.mounted) return;
                            Navigator.pushNamedAndRemoveUntil(
                              context,
                              AppRouter.login,
                              (_) => false,
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
