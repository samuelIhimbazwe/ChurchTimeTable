import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_response.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/routing/app_router.dart';
import '../../auth/providers/auth_provider.dart';

class MinistriesScreen extends ConsumerStatefulWidget {
  const MinistriesScreen({super.key});

  @override
  ConsumerState<MinistriesScreen> createState() => _MinistriesScreenState();
}

class _MinistriesScreenState extends ConsumerState<MinistriesScreen> {
  List<Map<String, dynamic>> _ministries = const [];
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
      final res = await api.dio.get('/ministries');
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
        _ministries = parsed.data!
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
        title: Text(l10n.ministries_title),
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
                    itemCount: _ministries.length,
                    separatorBuilder: (_, __) => const SizedBox(height: Spacing.sm),
                    itemBuilder: (context, index) {
                      final m = _ministries[index];
                      return Card(
                        child: ListTile(
                          title: Text(m['name']?.toString() ?? ''),
                          subtitle: Text(
                            '${m['code']} · ${m['memberCount'] ?? 0} members · ${m['leadershipCount'] ?? 0} leaders',
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            Navigator.of(context).pushNamed(
                              AppRouter.ministryDetail,
                              arguments: m['id']?.toString(),
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
