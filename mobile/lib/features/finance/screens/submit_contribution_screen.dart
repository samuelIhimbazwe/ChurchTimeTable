import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_response.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../auth/providers/auth_provider.dart';

class SubmitContributionScreen extends ConsumerStatefulWidget {
  const SubmitContributionScreen({super.key});

  @override
  ConsumerState<SubmitContributionScreen> createState() =>
      _SubmitContributionScreenState();
}

class _SubmitContributionScreenState
    extends ConsumerState<SubmitContributionScreen> {
  Map<String, dynamic>? _options;
  String? _error;
  String? _typeId;
  String _amount = '';
  String _channel = 'MOMO';
  String _notes = '';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _loadOptions();
  }

  Future<void> _loadOptions() async {
    setState(() => _error = null);
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final res = await api.dio.get('/finance/contributions/submit-options');
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      if (!parsed.success || parsed.data == null) {
        setState(() => _error = parsed.error?.message ?? 'Load failed');
        return;
      }
      setState(() => _options = parsed.data);
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  Future<void> _submit() async {
    if (_typeId == null || _amount.trim().isEmpty) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final res = await api.dio.post(
        '/finance/contributions/submit',
        data: {
          'contributionTypeCatalogId': _typeId,
          'claimedAmount': double.parse(_amount),
          'paymentAt': DateTime.now().toUtc().toIso8601String(),
          'paymentChannel': _channel,
          'currency': 'RWF',
          if (_notes.trim().isNotEmpty) 'notes': _notes.trim(),
        },
      );
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      if (!parsed.success) {
        setState(() => _error = parsed.error?.message ?? 'Submit failed');
        return;
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Contribution submitted to your family head')),
      );
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  List<Map<String, dynamic>> get _types {
    final raw = _options?['types'];
    if (raw is! List) return const [];
    return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final family = _options?['family'] as Map<String, dynamic>?;

    return Scaffold(
      appBar: AppBar(title: const Text('Submit contribution')),
      body: _error != null
          ? Center(child: Text(_error!))
          : _options == null
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.all(CmmsSpacing.md),
                  children: [
                    if (family != null)
                      Card(
                        child: ListTile(
                          title: Text(family['name']?.toString() ?? 'Family'),
                          subtitle: Text(
                            'Payment goes to your family head for approval',
                          ),
                        ),
                      ),
                    const SizedBox(height: CmmsSpacing.md),
                    DropdownButtonFormField<String>(
                      value: _typeId,
                      decoration: const InputDecoration(
                        labelText: 'Contribution type',
                        border: OutlineInputBorder(),
                      ),
                      items: _types
                          .map(
                            (t) => DropdownMenuItem(
                              value: t['id']?.toString(),
                              child: Text(t['name']?.toString() ?? '—'),
                            ),
                          )
                          .toList(),
                      onChanged: (v) => setState(() => _typeId = v),
                    ),
                    const SizedBox(height: CmmsSpacing.md),
                    TextField(
                      decoration: const InputDecoration(
                        labelText: 'Amount (RWF)',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      onChanged: (v) => _amount = v,
                    ),
                    const SizedBox(height: CmmsSpacing.md),
                    DropdownButtonFormField<String>(
                      value: _channel,
                      decoration: const InputDecoration(
                        labelText: 'Payment channel',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'MOMO', child: Text('Mobile Money')),
                        DropdownMenuItem(value: 'BANK', child: Text('Bank')),
                        DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                      ],
                      onChanged: (v) {
                        if (v != null) setState(() => _channel = v);
                      },
                    ),
                    const SizedBox(height: CmmsSpacing.md),
                    TextField(
                      decoration: const InputDecoration(
                        labelText: 'Notes (optional)',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 2,
                      onChanged: (v) => _notes = v,
                    ),
                    const SizedBox(height: CmmsSpacing.lg),
                    FilledButton(
                      onPressed: _submitting ? null : _submit,
                      child: _submitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Submit claim'),
                    ),
                  ],
                ),
    );
  }
}
