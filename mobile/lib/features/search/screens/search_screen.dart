import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_response.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/widgets/mobile_tab_shell.dart';
import '../../auth/providers/auth_provider.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  Map<String, dynamic>? _results;
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _runSearch(String query) async {
    if (query.trim().length < 2) {
      setState(() {
        _results = null;
        _error = null;
        _loading = false;
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final res = await api.dio.get('/search', queryParameters: {'q': query.trim()});
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      if (!parsed.success || parsed.data == null) {
        setState(() {
          _error = parsed.error?.message ?? 'Search failed';
          _loading = false;
        });
        return;
      }
      setState(() {
        _results = parsed.data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  List<Map<String, dynamic>> _groupItems(String key) {
    final items = (_results?[key] as List?) ?? const [];
    return items.map((item) => Map<String, dynamic>.from(item as Map)).toList();
  }

  String _itemTitle(Map<String, dynamic> item) {
    switch (item['type']) {
      case 'member':
        final number = item['memberNumber']?.toString();
        final name = item['displayName']?.toString() ?? '—';
        if (number != null && number.isNotEmpty) return '$number · $name';
        return name;
      case 'family':
        return '${item['familyCode']} · ${item['familyName']}';
      case 'event':
      case 'assignment':
        return item['title']?.toString() ?? '—';
      case 'contribution':
        return item['referenceNumber']?.toString() ?? '—';
      case 'welfareCase':
      case 'welfareAssistance':
        return item['title']?.toString() ?? item['description']?.toString() ?? '—';
      case 'song':
        return item['title']?.toString() ?? '—';
      case 'rehearsal':
        return item['title']?.toString() ?? '—';
      case 'welfareCategory':
      case 'songCategory':
        return item['name']?.toString() ?? '—';
      case 'choirDocument':
      case 'choirMeeting':
      case 'meetingActionItem':
        return item['title']?.toString() ?? '—';
      case 'meetingDecision':
        return item['decision']?.toString() ?? '—';
      default:
        return '—';
    }
  }

  void _openResult(Map<String, dynamic> item) {
    switch (item['type']) {
      case 'member':
        Navigator.pushNamed(context, '/members');
        return;
      case 'family':
        Navigator.pushNamed(context, '/families');
        return;
      case 'event':
      case 'assignment':
      case 'rehearsal':
        Navigator.pushNamed(context, '/calendar');
        return;
      case 'contribution':
        Navigator.pushNamed(context, '/finance');
        return;
      case 'welfareCase':
      case 'welfareCategory':
      case 'welfareAssistance':
        Navigator.pushNamed(context, '/welfare');
        return;
      case 'song':
      case 'songCategory':
        Navigator.pushNamed(context, '/music');
        return;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final embedded = MobileTabShellScope.embeddedInShell(context);

    final body = Padding(
      padding: const EdgeInsets.all(CmmsSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _controller,
            decoration: InputDecoration(
              labelText: l10n.search_placeholder,
              prefixIcon: const Icon(Icons.search),
            ),
            onSubmitted: _runSearch,
            onChanged: (value) {
              Future<void>.delayed(const Duration(milliseconds: 300), () {
                if (!mounted || _controller.text != value) return;
                _runSearch(value);
              });
            },
          ),
          const SizedBox(height: CmmsSpacing.md),
          if (_loading) LinearProgressIndicator(minHeight: 2),
          if (_error != null) Text(_error!),
          Expanded(
            child: ListView(
              children: [
                if (_results != null) ...[
                  if (_groupItems('members').isNotEmpty)
                    _ResultGroup(
                      title: l10n.search_group_members,
                      items: _groupItems('members'),
                      itemTitle: _itemTitle,
                      onTap: _openResult,
                    ),
                  if (_groupItems('families').isNotEmpty)
                    _ResultGroup(
                      title: l10n.search_group_families,
                      items: _groupItems('families'),
                      itemTitle: _itemTitle,
                      onTap: _openResult,
                    ),
                  if (_groupItems('events').isNotEmpty)
                    _ResultGroup(
                      title: l10n.search_group_events,
                      items: _groupItems('events'),
                      itemTitle: _itemTitle,
                      onTap: _openResult,
                    ),
                  if (_groupItems('assignments').isNotEmpty)
                    _ResultGroup(
                      title: l10n.search_group_assignments,
                      items: _groupItems('assignments'),
                      itemTitle: _itemTitle,
                      onTap: _openResult,
                    ),
                  if (_groupItems('contributions').isNotEmpty)
                    _ResultGroup(
                      title: l10n.search_group_contributions,
                      items: _groupItems('contributions'),
                      itemTitle: _itemTitle,
                      onTap: _openResult,
                    ),
                  if (_groupItems('welfareCases').isNotEmpty)
                    _ResultGroup(
                      title: l10n.search_group_welfare_cases,
                      items: _groupItems('welfareCases'),
                      itemTitle: _itemTitle,
                      onTap: _openResult,
                    ),
                  if (_groupItems('songs').isNotEmpty)
                    _ResultGroup(
                      title: l10n.search_group_songs,
                      items: _groupItems('songs'),
                      itemTitle: _itemTitle,
                      onTap: _openResult,
                    ),
                  if (_groupItems('rehearsals').isNotEmpty)
                    _ResultGroup(
                      title: l10n.search_group_rehearsals,
                      items: _groupItems('rehearsals'),
                      itemTitle: _itemTitle,
                      onTap: _openResult,
                    ),
                ],
              ],
            ),
          ),
        ],
      ),
    );

    if (embedded) return body;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.search_title)),
      body: body,
    );
  }
}

class _ResultGroup extends StatelessWidget {
  const _ResultGroup({
    required this.title,
    required this.items,
    required this.itemTitle,
    required this.onTap,
  });

  final String title;
  final List<Map<String, dynamic>> items;
  final String Function(Map<String, dynamic> item) itemTitle;
  final void Function(Map<String, dynamic> item) onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: CmmsSpacing.sm),
          child: Text(title, style: Theme.of(context).textTheme.titleSmall),
        ),
        ...items.map(
          (item) => Card(
            child: ListTile(
              title: Text(itemTitle(item)),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => onTap(item),
            ),
          ),
        ),
      ],
    );
  }
}
