import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/governance_permissions.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';

class WelfareCreateScreen extends ConsumerStatefulWidget {
  const WelfareCreateScreen({super.key});

  @override
  ConsumerState<WelfareCreateScreen> createState() => _WelfareCreateScreenState();
}

class _WelfareCreateScreenState extends ConsumerState<WelfareCreateScreen> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _memberIdController = TextEditingController();
  final _amountController = TextEditingController();
  List<Map<String, dynamic>> _categories = const [];
  String? _categoryId;
  int _step = 0;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _memberIdController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final repo = ref.read(choirRepositoryProvider);
      final cats = await repo.fetchWelfareCategories();
      setState(() {
        _categories = cats;
        if (cats.isNotEmpty) _categoryId = cats.first['id']?.toString();
      });
    } catch (_) {}
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final repo = ref.read(choirRepositoryProvider);
      await repo.createWelfareCase({
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'memberId': _memberIdController.text.trim(),
        'categoryId': _categoryId,
        if (_amountController.text.trim().isNotEmpty)
          'requestedAmount': double.parse(_amountController.text.trim()),
        'status': 'DRAFT',
      });
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() {
        _error = e.toString();
        _submitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.welfare_create_title)),
      body: ListView(
        padding: const EdgeInsets.all(Spacing.md),
        children: [
          if (_error != null)
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          if (_step == 0) ...[
            TextField(
              controller: _titleController,
              decoration: InputDecoration(labelText: l10n.welfare_field_title),
            ),
            const SizedBox(height: Spacing.sm),
            TextField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: InputDecoration(labelText: l10n.welfare_field_description),
            ),
          ],
          if (_step == 1) ...[
            TextField(
              controller: _memberIdController,
              decoration: InputDecoration(labelText: l10n.welfare_field_member_id),
            ),
            const SizedBox(height: Spacing.sm),
            DropdownButtonFormField<String>(
              value: _categoryId,
              decoration: InputDecoration(labelText: l10n.welfare_category),
              items: _categories
                  .map(
                    (c) => DropdownMenuItem(
                      value: c['id']?.toString(),
                      child: Text(c['name']?.toString() ?? ''),
                    ),
                  )
                  .toList(),
              onChanged: (v) => setState(() => _categoryId = v),
            ),
          ],
          if (_step == 2) ...[
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(labelText: l10n.welfare_amount),
            ),
          ],
          const SizedBox(height: Spacing.lg),
          Row(
            children: [
              if (_step > 0)
                TextButton(
                  onPressed: _submitting ? null : () => setState(() => _step -= 1),
                  child: Text(l10n.common_back),
                ),
              const Spacer(),
              if (_step < 2)
                FilledButton(
                  onPressed: _submitting ? null : () => setState(() => _step += 1),
                  child: Text(l10n.common_next),
                )
              else
                FilledButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(l10n.welfare_submit_case),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
