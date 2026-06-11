import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_response.dart';
import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../auth/providers/auth_provider.dart';

/// Read-only protocol contribution list for treasurer / president / VP oversight.
class ProtocolTreasuryScreen extends ConsumerStatefulWidget {
  const ProtocolTreasuryScreen({super.key});

  @override
  ConsumerState<ProtocolTreasuryScreen> createState() =>
      _ProtocolTreasuryScreenState();
}

class _ProtocolTreasuryScreenState
    extends ConsumerState<ProtocolTreasuryScreen> {
  List<Map<String, dynamic>> _items = const [];
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final res = await api.dio.get(
        '/finance/contributions',
        queryParameters: {'ministryScope': 'PROTOCOL', 'limit': 80},
      );
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      if (!parsed.success || parsed.data == null) {
        setState(() => _error = parsed.error?.message ?? 'Load failed');
        return;
      }
      final raw = parsed.data!['items'];
      final list = raw is List
          ? raw.map((e) => Map<String, dynamic>.from(e as Map)).toList()
          : <Map<String, dynamic>>[];
      setState(() => _items = list);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatAmount(dynamic value) {
    final amount =
        value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
    return '${amount.toStringAsFixed(0)} RWF';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Protocol treasury'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(CmmsSpacing.md),
                    children: [
                      const Text(
                        'Read-only list — confirm and adjust on web treasury desk.',
                        style: TextStyle(fontSize: 13),
                      ),
                      const SizedBox(height: CmmsSpacing.md),
                      if (_items.isEmpty)
                        const CmmsCard(
                          child: Text('No protocol contributions yet.'),
                        )
                      else
                        ..._items.map(
                          (item) => CmmsCard(
                            child: ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                item['memberName']?.toString() ?? 'Member',
                              ),
                              subtitle: Text(
                                '${item['typeName'] ?? item['status']} · ${item['status']}',
                              ),
                              trailing: Text(
                                _formatAmount(
                                  item['claimedAmount'] ?? item['amount'],
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }
}
