import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_response.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/localization/locale_date_format.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../core/widgets/shell_aware_scaffold.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final api = ref.read(apiClientProvider);
    try {
      await api.loadToken();
      final res = await api.dio.get('/notifications');
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      setState(() {
        _items = (parsed.data?['items'] as List?) ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final lang = ref.watch(localeProvider).languageCode;

    return ShellAwareScaffold(
      title: l10n.notifications_title,
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh),
          tooltip: l10n.common_refresh,
          onPressed: _load,
        ),
      ],
      body: _loading
          ? Center(child: Text(l10n.common_loading))
          : Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 920),
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: _items.length,
                  itemBuilder: (_, i) {
                    final n = _items[i] as Map<String, dynamic>;
                    final created = DateTime.tryParse(
                      n['createdAt'] as String? ?? '',
                    );
                    return ListTile(
                      title: Text(n['title'] as String? ?? '', softWrap: true),
                      subtitle: Text(
                        n['body'] as String? ?? '',
                        softWrap: true,
                      ),
                      trailing: created != null
                          ? Text(
                              LocaleDateFormat.formatRelative(created, lang),
                              style: Theme.of(context).textTheme.bodySmall,
                            )
                          : null,
                    );
                  },
                ),
              ),
            ),
    );
  }
}
