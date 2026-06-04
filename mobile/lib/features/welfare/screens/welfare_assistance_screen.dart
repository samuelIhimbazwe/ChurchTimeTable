import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';

const _assistanceTypes = [
  'CASH',
  'TRANSPORT',
  'FOOD',
  'HOSPITAL',
  'MATERIAL',
  'VOLUNTEER',
  'PRAYER',
  'COUNSELING',
  'OTHER',
];

class WelfareAssistanceScreen extends ConsumerStatefulWidget {
  const WelfareAssistanceScreen({super.key, required this.caseId});

  final String caseId;

  @override
  ConsumerState<WelfareAssistanceScreen> createState() =>
      _WelfareAssistanceScreenState();
}

class _WelfareAssistanceScreenState extends ConsumerState<WelfareAssistanceScreen> {
  final _descriptionController = TextEditingController();
  final _amountController = TextEditingController();
  String _type = 'CASH';
  bool _saving = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      await ref.read(choirRepositoryProvider).recordWelfareAssistance({
        'caseId': widget.caseId,
        'assistanceType': _type,
        'description': _descriptionController.text.trim(),
        if (_amountController.text.trim().isNotEmpty)
          'amount': double.parse(_amountController.text.trim()),
      });
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.welfare_assistance_title)),
      body: ListView(
        padding: const EdgeInsets.all(Spacing.md),
        children: [
          DropdownButtonFormField<String>(
            value: _type,
            decoration: InputDecoration(labelText: l10n.welfare_assistance_type),
            items: _assistanceTypes
                .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                .toList(),
            onChanged: (v) => setState(() => _type = v ?? 'CASH'),
          ),
          const SizedBox(height: Spacing.sm),
          TextField(
            controller: _descriptionController,
            decoration: InputDecoration(labelText: l10n.welfare_field_description),
          ),
          const SizedBox(height: Spacing.sm),
          TextField(
            controller: _amountController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(labelText: l10n.welfare_amount),
          ),
          const SizedBox(height: Spacing.lg),
          FilledButton(
            onPressed: _saving || _descriptionController.text.trim().length < 3
                ? null
                : _save,
            child: Text(l10n.welfare_record_assistance),
          ),
        ],
      ),
    );
  }
}
