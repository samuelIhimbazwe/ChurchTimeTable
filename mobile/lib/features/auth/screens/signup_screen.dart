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
  final _nationalId = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  String _churchRelationship = 'NEW_TO_CHURCH';
  final Set<String> _interests = {};
  bool _acceptedTerms = false;
  int _step = 0;
  bool _showPassword = false;

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _phone.dispose();
    _nationalId.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_acceptedTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.onboarding_signup_terms_required)),
      );
      return;
    }
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
          nationalId: _nationalId.text.trim(),
          acceptedTerms: true,
          churchRelationship: _churchRelationship,
          interests: _interests.toList(),
          preferredLanguage: locale,
        );
    if (!mounted) return;
    if (ok) {
      Navigator.pushReplacementNamed(context, AppRouter.memberHome);
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
                LinearProgressIndicator(value: (_step + 1) / 4),
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
                    keyboardType: TextInputType.phone,
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return l10n.validation_required;
                      if (!RegExp(r'^\+?[0-9]{9,15}$').hasMatch(v.trim())) {
                        return l10n.validation_required;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _nationalId,
                    decoration: InputDecoration(
                      labelText: l10n.onboarding_signup_national_id,
                      helperText: l10n.onboarding_signup_national_id_hint,
                    ),
                    keyboardType: TextInputType.number,
                    maxLength: 16,
                    validator: (v) {
                      if (v == null || !RegExp(r'^\d{16}$').hasMatch(v.trim())) {
                        return l10n.validation_required;
                      }
                      return null;
                    },
                  ),
                ],
                if (_step == 1) ...[
                  DropdownButtonFormField<String>(
                    value: _churchRelationship,
                    decoration: const InputDecoration(labelText: 'Church relationship'),
                    items: const [
                      DropdownMenuItem(value: 'EXISTING', child: Text('Existing church member')),
                      DropdownMenuItem(value: 'NEW_TO_CHURCH', child: Text('New member')),
                      DropdownMenuItem(value: 'VISITOR', child: Text('Visitor')),
                      DropdownMenuItem(value: 'RETURNING', child: Text('Returning member')),
                    ],
                    onChanged: (value) =>
                        setState(() => _churchRelationship = value ?? 'NEW_TO_CHURCH'),
                  ),
                ],
                if (_step == 2) ...[
                  Text('Interests (optional — no membership granted)', style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: ['CHOIR', 'PROTOCOL', 'YOUTH', 'WOMEN', 'MEN'].map((interest) {
                      final selected = _interests.contains(interest);
                      return FilterChip(
                        label: Text(interest),
                        selected: selected,
                        onSelected: (value) {
                          setState(() {
                            if (value) {
                              _interests.add(interest);
                            } else {
                              _interests.remove(interest);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                ],
                if (_step == 3) ...[
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
                  CheckboxListTile(
                    value: _acceptedTerms,
                    onChanged: auth.loading
                        ? null
                        : (value) => setState(() => _acceptedTerms = value ?? false),
                    contentPadding: EdgeInsets.zero,
                    controlAffinity: ListTileControlAffinity.leading,
                    title: Text(l10n.onboarding_signup_terms_label),
                  ),
                  const SizedBox(height: 8),
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
                        label: _step < 3 ? l10n.onboarding_signup_continue : l10n.onboarding_signup_submit,
                        isLoading: auth.loading,
                        onPressed: auth.loading
                            ? null
                            : () {
                                if (_step < 3) {
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
}
