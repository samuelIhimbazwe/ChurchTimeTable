import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_response.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../auth/providers/auth_provider.dart';

class MinistryDetailScreen extends ConsumerStatefulWidget {
  const MinistryDetailScreen({super.key, required this.ministryId});

  final String ministryId;

  @override
  ConsumerState<MinistryDetailScreen> createState() =>
      _MinistryDetailScreenState();
}

class _MinistryDetailScreenState extends ConsumerState<MinistryDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  Map<String, dynamic>? _ministry;
  Map<String, dynamic>? _summary;
  List<Map<String, dynamic>> _members = const [];
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 5, vsync: this);
    _tabs.addListener(() {
      if (!_tabs.indexIsChanging) _loadTab(_tabs.index);
    });
    _loadOverview();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _loadOverview() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final results = await Future.wait([
        api.dio.get('/ministries/${widget.ministryId}'),
        api.dio.get('/ministries/${widget.ministryId}/summary'),
      ]);
      final ministryParsed = ApiResponse<Map<String, dynamic>>.fromJson(
        results[0].data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      final summaryParsed = ApiResponse<Map<String, dynamic>>.fromJson(
        results[1].data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      if (!ministryParsed.success || ministryParsed.data == null) {
        setState(() {
          _error = ministryParsed.error?.message ?? 'Load failed';
          _loading = false;
        });
        return;
      }
      setState(() {
        _ministry = ministryParsed.data;
        _summary =
            summaryParsed.success && summaryParsed.data != null
                ? summaryParsed.data
                : null;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _loadTab(int index) async {
    if (index == 0) return;
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      if (index == 1) {
        final res = await api.dio.get('/ministries/${widget.ministryId}/members');
        final parsed = ApiResponse<List<dynamic>>.fromJson(
          res.data as Map<String, dynamic>,
          (d) => d as List<dynamic>,
        );
        if (parsed.success && parsed.data != null) {
          setState(() {
            _members = parsed.data!
                .map((e) => Map<String, dynamic>.from(e as Map))
                .toList();
          });
        }
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.ministry_detail_title)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null || _ministry == null) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.ministry_detail_title)),
        body: Center(child: Text(_error ?? 'Not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_ministry!['name']?.toString() ?? l10n.ministry_detail_title),
        actions: [
          IconButton(
            icon: const Icon(Icons.hub_outlined),
            tooltip: 'Ministry services',
            onPressed: () => Navigator.of(context).pushNamed(
              '/ministries/services',
              arguments: widget.ministryId,
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Members'),
            Tab(text: 'Leadership'),
            Tab(text: 'Permissions'),
            Tab(text: 'Settings'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _buildOverview(),
          _buildMembers(),
          const Center(child: Text('Leadership (read-first)')),
          const Center(child: Text('Permissions (read-first)')),
          const Center(child: Text('Settings (read-first)')),
        ],
      ),
    );
  }

  Widget _buildOverview() {
    final s = _summary;
    return ListView(
      padding: const EdgeInsets.all(Spacing.md),
      children: [
        if (s != null) ...[
          _statCard('Members', s['memberCount']?.toString() ?? '0'),
          _statCard('Leaders', s['activeLeaders']?.toString() ?? '0'),
          _statCard('Permissions', s['activePermissions']?.toString() ?? '0'),
        ],
        if (_ministry?['description'] != null)
          Padding(
            padding: const EdgeInsets.only(top: Spacing.md),
            child: Text(_ministry!['description'].toString()),
          ),
      ],
    );
  }

  Widget _statCard(String label, String value) {
    return Card(
      margin: const EdgeInsets.only(bottom: Spacing.sm),
      child: ListTile(
        title: Text(label),
        trailing: Text(
          value,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildMembers() {
    if (_members.isEmpty) {
      return const Center(child: Text('Pull to refresh or switch tabs'));
    }
    return ListView.builder(
      itemCount: _members.length,
      itemBuilder: (context, i) {
        final row = _members[i];
        final member = row['member'] as Map<String, dynamic>? ?? {};
        return ListTile(
          title: Text('${member['firstName'] ?? ''} ${member['lastName'] ?? ''}'),
          subtitle: Text(row['status']?.toString() ?? ''),
        );
      },
    );
  }
}
