import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_response.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/routing/app_router.dart';
import '../../auth/providers/auth_provider.dart';

class OperationalUnitsScreen extends ConsumerStatefulWidget {
  const OperationalUnitsScreen({super.key});

  @override
  ConsumerState<OperationalUnitsScreen> createState() =>
      _OperationalUnitsScreenState();
}

class _OperationalUnitsScreenState extends ConsumerState<OperationalUnitsScreen> {
  List<Map<String, dynamic>> _units = const [];
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
      final res = await api.dio.get('/operational-units');
      final parsed = ApiResponse<List<dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => d as List<dynamic>,
      );
      if (!parsed.success || parsed.data == null) {
        setState(() {
          _error = parsed.error?.message ?? 'Load failed';
          _loading = false;
        });
        return;
      }
      setState(() {
        _units = parsed.data!
            .map((item) => Map<String, dynamic>.from(item as Map))
            .toList();
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
        title: Text(l10n.operational_units_title),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(Spacing.md),
                    itemCount: _units.length,
                    separatorBuilder: (_, __) => const SizedBox(height: Spacing.sm),
                    itemBuilder: (context, index) {
                      final u = _units[index];
                      final ministry = u['ministry'] as Map<String, dynamic>?;
                      return Card(
                        child: ListTile(
                          title: Text(u['name']?.toString() ?? ''),
                          subtitle: Text(
                            '${u['type']} · ${ministry?['name'] ?? ''} · ${u['memberCount'] ?? 0} members',
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            Navigator.of(context).pushNamed(
                              AppRouter.operationalUnitDetail,
                              arguments: u['id']?.toString(),
                            );
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
