import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/design/components/brand/cmms_brand_logo.dart';
import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/design/tokens/colors.dart';
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
  bool _showPassword = false;

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
    final isWide = MediaQuery.sizeOf(context).width >= 900;

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

    final form = _LoginForm(
      formKey: _formKey,
      email: _email,
      password: _password,
      showPassword: _showPassword,
      onTogglePassword: () => setState(() => _showPassword = !_showPassword),
      loading: auth.loading,
      onSubmit: _submit,
      onSignup: auth.loading
          ? null
          : () => Navigator.pushNamed(context, AppRouter.signup),
      l10n: l10n,
    );

    if (isWide) {
      return Scaffold(
        body: Row(
          children: [
            Expanded(
              child: _LoginBrandPanel(l10n: l10n),
            ),
            Expanded(
              child: ColoredBox(
                color: CmmsColors.background(
                  Theme.of(context).brightness == Brightness.dark,
                ),
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(32),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 420),
                      child: form,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: CmmsColors.background(
        Theme.of(context).brightness == Brightness.dark,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            children: [
              const SizedBox(height: 16),
              const CmmsBrandLogo(size: 44, showWordmark: true, subtitle: 'Church System'),
              const SizedBox(height: 32),
              form,
            ],
          ),
        ),
      ),
    );
  }
}

class _LoginBrandPanel extends StatelessWidget {
  const _LoginBrandPanel({required this.l10n});

  final dynamic l10n;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: CmmsColors.primary900,
      child: Stack(
        children: [
          Positioned(
            top: -80,
            right: -80,
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: CmmsColors.primary700.withValues(alpha: 0.4),
              ),
            ),
          ),
          Positioned(
            bottom: -60,
            left: -60,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: CmmsColors.gold700.withValues(alpha: 0.2),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(48),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const CmmsBrandLogo(
                  size: 48,
                  showWordmark: true,
                  subtitle: 'Church System',
                  lightContext: true,
                ),
                const Spacer(),
                Text(
                  '"Let everything be done decently and in order."',
                  style: GoogleFonts.cormorantGaramond(
                    fontSize: 32,
                    fontStyle: FontStyle.italic,
                    fontWeight: FontWeight.w500,
                    color: CmmsColors.textInverse,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  width: 40,
                  height: 2,
                  color: CmmsColors.gold500,
                ),
                const SizedBox(height: 12),
                Text(
                  '1 Cor 14:40',
                  style: TextStyle(
                    color: CmmsColors.primary300,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 48),
                Text(
                  '© ${DateTime.now().year} CMMS',
                  style: TextStyle(
                    color: CmmsColors.primary400,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LoginForm extends StatelessWidget {
  const _LoginForm({
    required this.formKey,
    required this.email,
    required this.password,
    required this.showPassword,
    required this.onTogglePassword,
    required this.loading,
    required this.onSubmit,
    required this.onSignup,
    required this.l10n,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController email;
  final TextEditingController password;
  final bool showPassword;
  final VoidCallback onTogglePassword;
  final bool loading;
  final VoidCallback onSubmit;
  final VoidCallback? onSignup;
  final dynamic l10n;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Welcome back',
            style: GoogleFonts.cormorantGaramond(
              fontSize: 32,
              fontWeight: FontWeight.w600,
              color: CmmsColors.textPrimary(isDark),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Sign in to your church account',
            style: TextStyle(
              color: CmmsColors.textSecondary(isDark),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 28),
          TextFormField(
            controller: email,
            decoration: InputDecoration(
              labelText: l10n.auth_email_label,
              prefixIcon: const Icon(Icons.mail_outline, size: 20),
            ),
            keyboardType: TextInputType.emailAddress,
            validator: (v) =>
                v != null && v.contains('@') ? null : l10n.auth_email_invalid,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: password,
            decoration: InputDecoration(
              labelText: l10n.auth_password_label,
              prefixIcon: const Icon(Icons.lock_outline, size: 20),
              suffixIcon: IconButton(
                icon: Icon(
                  showPassword ? Icons.visibility_off : Icons.visibility,
                  size: 20,
                ),
                onPressed: onTogglePassword,
              ),
            ),
            obscureText: !showPassword,
            validator: (v) => v != null && v.length >= 6
                ? null
                : l10n.auth_password_min_length,
          ),
          const SizedBox(height: 24),
          CmmsButton(
            label: l10n.auth_sign_in_action,
            onPressed: loading ? null : onSubmit,
            isLoading: loading,
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: onSignup,
            child: Text(l10n.auth_create_account),
          ),
        ],
      ),
    );
  }
}
