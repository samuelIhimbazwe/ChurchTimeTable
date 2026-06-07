import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_response.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/widgets/mobile_tab_shell.dart';
import '../../auth/providers/auth_provider.dart';

class FamiliesScreen extends ConsumerStatefulWidget {
  const FamiliesScreen({super.key});

  @override
  ConsumerState<FamiliesScreen> createState() => _FamiliesScreenState();
}

class _FamiliesScreenState extends ConsumerState<FamiliesScreen> {
  List<Map<String, dynamic>> _families = const [];
  Map<String, dynamic>? _selected;
  Map<String, dynamic>? _metrics;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadFamilies();
  }

  Future<void> _loadFamilies() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final res = await api.dio.get(
        '/families',
        queryParameters: {'limit': 100, 'includeMetrics': 'true'},
      );
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
      final items = (parsed.data!['items'] as List? ?? const [])
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
      setState(() {
        _families = items;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _loadDetail(String id) async {
    setState(() {
      _error = null;
      _metrics = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final results = await Future.wait<dynamic>([
        api.dio.get('/families/$id'),
        api.dio.get('/families/$id/metrics'),
      ]);
      final detailParsed = ApiResponse<Map<String, dynamic>>.fromJson(
        results[0].data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      final metricsParsed = ApiResponse<Map<String, dynamic>>.fromJson(
        results[1].data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      if (!detailParsed.success || detailParsed.data == null) {
        setState(() => _error = detailParsed.error?.message ?? 'Load failed');
        return;
      }
      setState(() {
        _selected = detailParsed.data;
        _metrics =
            metricsParsed.success && metricsParsed.data != null
                ? metricsParsed.data
                : null;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  String _metricValue(Map<String, dynamic>? section, String key) {
    if (section == null) return '—';
    final value = section[key];
    return value?.toString() ?? '—';
  }

  String _headLabel(Map<String, dynamic>? head) {
    if (head == null) return '—';
    final number = head['memberNumber']?.toString();
    final name = '${head['firstName'] ?? ''} ${head['lastName'] ?? ''}'.trim();
    if (number != null && number.isNotEmpty) return '$number · $name';
    return name.isEmpty ? '—' : name;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final embedded = MobileTabShellScope.embeddedInShell(context);

    final body = _loading
        ? Center(child: Text(l10n.common_loading))
        : _error != null
            ? Center(child: Text(_error!))
            : RefreshIndicator(
                onRefresh: _loadFamilies,
                child: ListView(
                  padding: const EdgeInsets.all(CmmsSpacing.md),
                  children: [
                    if (_selected != null) ...[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(CmmsSpacing.md),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _selected!['familyName']?.toString() ?? '—',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              Text(_selected!['familyCode']?.toString() ?? ''),
                              const SizedBox(height: CmmsSpacing.sm),
                              Text('${l10n.families_head}: ${_headLabel(_selected!['headMember'] != null ? Map<String, dynamic>.from(_selected!['headMember'] as Map) : null)}'),
                              Text(
                                '${l10n.families_member_count}: ${((_selected!['members'] as List?) ?? const []).length}',
                              ),
                              if (_metrics != null) ...[
                                const Divider(height: CmmsSpacing.lg),
                                Text(
                                  '${l10n.families_health_score}: ${_metricValue(_metrics!['health'] != null ? Map<String, dynamic>.from(_metrics!['health'] as Map) : null, 'score')} (${_metricValue(_metrics!['health'] != null ? Map<String, dynamic>.from(_metrics!['health'] as Map) : null, 'grade')})',
                                  style: Theme.of(context).textTheme.titleSmall,
                                ),
                                Text(
                                  '${l10n.families_attendance}: ${_metricValue(_metrics!['attendance'] != null ? Map<String, dynamic>.from(_metrics!['attendance'] as Map) : null, 'attendanceRate')}% · ${_metricValue(_metrics!['attendance'] != null ? Map<String, dynamic>.from(_metrics!['attendance'] as Map) : null, 'attendanceCount')} present',
                                ),
                                if (_metrics!['contributions'] != null)
                                  Text(
                                    '${l10n.families_contributions}: ${_metricValue(_metrics!['contributions'] != null ? Map<String, dynamic>.from(_metrics!['contributions'] as Map) : null, 'confirmedAmount')}',
                                  ),
                                Text(
                                  '${l10n.families_participation}: ${_metricValue(_metrics!['participation'] != null ? Map<String, dynamic>.from(_metrics!['participation'] as Map) : null, 'activeAssignments')} assignments · ${_metricValue(_metrics!['participation'] != null ? Map<String, dynamic>.from(_metrics!['participation'] as Map) : null, 'activeLeaders')} leaders',
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: CmmsSpacing.md),
                    ],
                    ..._families.map(
                      (family) => Card(
                        child: ListTile(
                          title: Text(family['familyName']?.toString() ?? '—'),
                          subtitle: Text(
                            '${family['familyCode']} · ${l10n.families_member_count}: ${family['memberCount'] ?? 0}${family['healthScore'] != null ? ' · ${family['healthScore']} (${family['healthGrade'] ?? ''})' : ''}',
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => _loadDetail(family['id'].toString()),
                        ),
                      ),
                    ),
                  ],
                ),
              );

    if (embedded) return body;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.families_title),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadFamilies),
        ],
      ),
      body: body,
    );
  }
}
