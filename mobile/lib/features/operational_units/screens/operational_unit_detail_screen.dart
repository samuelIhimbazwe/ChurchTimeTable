import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_response.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../auth/providers/auth_provider.dart';

class OperationalUnitDetailScreen extends ConsumerStatefulWidget {
  const OperationalUnitDetailScreen({super.key, required this.unitId});

  final String unitId;

  @override
  ConsumerState<OperationalUnitDetailScreen> createState() =>
      _OperationalUnitDetailScreenState();
}

class _OperationalUnitDetailScreenState
    extends ConsumerState<OperationalUnitDetailScreen> {
  Map<String, dynamic>? _summary;
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
      final res = await api.dio.get('/operational-units/${widget.unitId}/summary');
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      if (!parsed.success || parsed.data == null) {
        setState(() {
          _error = parsed.error?.message ?? 'Load failed';
          _loading = false;
        });
        return;
      }
      setState(() {
        _summary = parsed.data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _summary?['name']?.toString() ?? l10n.operational_unit_detail_title,
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : ListView(
                  padding: const EdgeInsets.all(Spacing.md),
                  children: [
                    Text('Type: ${_summary?['type']}'),
                    Text('Members: ${_summary?['memberCount']}'),
                    Text('Leaders: ${_summary?['activeLeaders']}'),
                    const SizedBox(height: Spacing.md),
                    const Text('Members, leadership, permissions, and settings tabs are read-first on mobile.'),
                  ],
                ),
    );
  }
}
