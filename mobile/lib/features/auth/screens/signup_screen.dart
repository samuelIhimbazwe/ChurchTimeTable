import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/components/buttons/cmms_button.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/routing/app_router.dart';
import '../providers/auth_provider.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  String _ministry = 'CHOIR';
  int _step = 0;
  bool _showPassword = false;

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_password.text != _confirmPassword.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.onboarding_signup_password_mismatch)),
      );
      return;
    }

    final locale = Localizations.localeOf(context).languageCode;
    final ok = await ref.read(authProvider.notifier).register(
          email: _email.text.trim(),
          password: _password.text,
          firstName: _firstName.text.trim(),
          lastName: _lastName.text.trim(),
          phone: _phone.text.trim(),
          ministry: _ministry,
          preferredLanguage: locale,
        );
    if (!mounted) return;
    if (ok) {
      Navigator.pushReplacementNamed(context, AppRouter.pendingApproval);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ref.read(authProvider.notifier).localizedError(context.l10n)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.onboarding_signup_title)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LinearProgressIndicator(value: (_step + 1) / 3),
                const SizedBox(height: 24),
                if (_step == 0) ...[
                  TextFormField(
                    controller: _firstName,
                    decoration: InputDecoration(labelText: l10n.onboarding_signup_first_name),
                    validator: (v) => v != null && v.trim().isNotEmpty ? null : l10n.validation_required,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _lastName,
                    decoration: InputDecoration(labelText: l10n.onboarding_signup_last_name),
                    validator: (v) => v != null && v.trim().isNotEmpty ? null : l10n.validation_required,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _email,
                    decoration: InputDecoration(labelText: l10n.auth_email_label),
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) => v != null && v.contains('@') ? null : l10n.auth_email_invalid,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _phone,
                    decoration: InputDecoration(labelText: l10n.onboarding_signup_phone),
                  ),
                ],
                if (_step == 1) ...[
                  DropdownButtonFormField<String>(
                    value: _ministry,
                    decoration: InputDecoration(labelText: l10n.onboarding_signup_ministry),
                    items: [
                      DropdownMenuItem(value: 'CHOIR', child: Text(l10n.onboarding_signup_ministry_choir)),
                      DropdownMenuItem(value: 'PROTOCOL', child: Text(l10n.onboarding_signup_ministry_protocol)),
                      DropdownMenuItem(value: 'BOTH', child: Text(l10n.onboarding_signup_ministry_both)),
                    ],
                    onChanged: (value) => setState(() => _ministry = value ?? 'CHOIR'),
                  ),
                  const SizedBox(height: 12),
                  Text(_ministryDescription(l10n)),
                ],
                if (_step == 2) ...[
                  TextFormField(
                    controller: _password,
                    decoration: InputDecoration(
                      labelText: l10n.auth_password_label,
                      suffixIcon: IconButton(
                        icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility),
                        onPressed: () => setState(() => _showPassword = !_showPassword),
                      ),
                    ),
                    obscureText: !_showPassword,
                    validator: (v) => v != null && v.length >= 6 ? null : l10n.auth_password_min_length,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _confirmPassword,
                    decoration: InputDecoration(labelText: l10n.onboarding_signup_confirm_password),
                    obscureText: !_showPassword,
                    validator: (v) => v != null && v.length >= 6 ? null : l10n.auth_password_min_length,
                  ),
                  const SizedBox(height: 12),
                  Text(l10n.onboarding_signup_approval_note),
                ],
                const SizedBox(height: 24),
                Row(
                  children: [
                    if (_step > 0)
                      Expanded(
                        child: CmmsButton(
                          label: l10n.onboarding_signup_back,
                          variant: CmmsButtonVariant.secondary,
                          onPressed: auth.loading ? null : () => setState(() => _step -= 1),
                        ),
                      ),
                    if (_step > 0) const SizedBox(width: 12),
                    Expanded(
                      child: CmmsButton(
                        label: _step < 2 ? l10n.onboarding_signup_continue : l10n.onboarding_signup_submit,
                        isLoading: auth.loading,
                        onPressed: auth.loading
                            ? null
                            : () {
                                if (_step < 2) {
                                  if (_formKey.currentState!.validate()) {
                                    setState(() => _step += 1);
                                  }
                                } else {
                                  _submit();
                                }
                              },
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () => Navigator.pushReplacementNamed(context, AppRouter.login),
                  child: Text(l10n.onboarding_signup_have_account),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _ministryDescription(dynamic l10n) {
    switch (_ministry) {
      case 'PROTOCOL':
        return l10n.onboarding_signup_ministry_protocol_desc;
      case 'BOTH':
        return l10n.onboarding_signup_ministry_both_desc;
      default:
        return l10n.onboarding_signup_ministry_choir_desc;
    }
  }
}
