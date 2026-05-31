import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/routing/app_router.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({
    super.key,
    this.redirectRoute,
  });

  final String? redirectRoute;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _redirectScheduled = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final l10n = context.l10n;
    final notifier = ref.read(authProvider.notifier);
    final ok = await notifier.login(_email.text.trim(), _password.text);
    if (!mounted) return;
    final auth = ref.read(authProvider);
    if (ok) {
      Navigator.pushReplacementNamed(
        context,
        AppRouter.postLoginRoute(
          auth,
          redirectRoute: widget.redirectRoute,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(notifier.localizedError(l10n))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);

    if (auth.initialized && auth.isAuthenticated && !_redirectScheduled) {
      _redirectScheduled = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        Navigator.pushReplacementNamed(
          context,
          AppRouter.postLoginRoute(
            auth,
            redirectRoute: widget.redirectRoute,
          ),
        );
      });
    }

    final form = Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.church,
            size: 72,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: 8),
          Text(
            l10n.app_title,
            style: Theme.of(context).textTheme.headlineMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          TextFormField(
            controller: _email,
            decoration: InputDecoration(labelText: l10n.auth_email_label),
            keyboardType: TextInputType.emailAddress,
            validator: (v) =>
                v != null && v.contains('@') ? null : l10n.auth_email_invalid,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _password,
            decoration: InputDecoration(labelText: l10n.auth_password_label),
            obscureText: true,
            validator: (v) => v != null && v.length >= 6
                ? null
                : l10n.auth_password_min_length,
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: CmmsButton(
              label: l10n.auth_sign_in_action,
              onPressed: auth.loading ? null : _submit,
              isLoading: auth.loading,
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: auth.loading
                ? null
                : () => Navigator.pushNamed(context, AppRouter.signup),
            child: Text(l10n.auth_create_account),
          ),
        ],
      ),
    );

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: Theme.of(context).colorScheme.outlineVariant,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 24,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: form,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
