import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/api/api_response.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../auth/providers/auth_provider.dart';
import '../ministry_services_cache.dart';

class MinistryServicesScreen extends ConsumerStatefulWidget {
  const MinistryServicesScreen({super.key, required this.ministryId});

  final String ministryId;

  @override
  ConsumerState<MinistryServicesScreen> createState() =>
      _MinistryServicesScreenState();
}

class _MinistryServicesScreenState extends ConsumerState<MinistryServicesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  MinistryServicesCache? _cache;
  final Map<String, List<Map<String, dynamic>>> _data = {};
  String? _error;
  bool _loading = true;

  static const _buckets = [
    ('announcements', 'Announcements'),
    ('documents', 'Documents'),
    ('meetings', 'Meetings'),
    ('activity', 'Activity'),
  ];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: _buckets.length + 1, vsync: this);
    _tabs.addListener(() {
      if (!_tabs.indexIsChanging) _loadBucket(_tabs.index);
    });
    _init();
  }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    _cache = MinistryServicesCache(prefs);
    for (var i = 0; i < _buckets.length; i++) {
      final cached = _cache!.readList(widget.ministryId, _buckets[i].$1);
      if (cached != null) _data[_buckets[i].$1] = cached;
    }
    setState(() => _loading = false);
    await _loadBucket(0);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _loadBucket(int index) async {
    if (index >= _buckets.length) {
      await _loadReports();
      return;
    }
    final bucket = _buckets[index].$1;
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final res = await api.dio.get('/ministries/${widget.ministryId}/$bucket');
      final parsed = ApiResponse<List<dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => d as List<dynamic>,
      );
      if (parsed.success && parsed.data != null) {
        final rows = parsed.data!
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        await _cache?.saveList(widget.ministryId, bucket, rows);
        setState(() {
          _data[bucket] = rows;
          _error = null;
        });
      }
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  Future<void> _loadReports() async {
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final res = await api.dio.get(
        '/ministries/${widget.ministryId}/reports/summary',
      );
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      if (parsed.success && parsed.data != null) {
        setState(() {
          _data['reports'] = [parsed.data!];
          _error = null;
        });
      }
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ministry services'),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabs: [
            ..._buckets.map((b) => Tab(text: b.$2)),
            const Tab(text: 'Reports'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          ..._buckets.map((b) => _buildList(b.$1, b.$2)),
          _buildReports(),
        ],
      ),
    );
  }

  Widget _buildList(String bucket, String label) {
    final rows = _data[bucket] ?? [];
    if (rows.isEmpty && _error != null) {
      return Center(child: Text(_error!));
    }
    if (rows.isEmpty) {
      return Center(child: Text('No $label'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(Spacing.md),
      itemCount: rows.length,
      itemBuilder: (context, i) {
        final row = rows[i];
        final title = row['title']?.toString() ??
            row['type']?.toString() ??
            row['summary']?.toString() ??
            'Item';
        return Card(
          child: ListTile(
            title: Text(title),
            subtitle: Text(row['status']?.toString() ?? row['category']?.toString() ?? ''),
          ),
        );
      },
    );
  }

  Widget _buildReports() {
    final summary = _data['reports']?.isNotEmpty == true ? _data['reports']!.first : null;
    if (summary == null) {
      return const Center(child: Text('No report summary'));
    }
    return ListView(
      padding: const EdgeInsets.all(Spacing.md),
      children: summary.entries
          .map(
            (e) => Card(
              child: ListTile(
                title: Text(e.key),
                trailing: Text(e.value.toString()),
              ),
            ),
          )
          .toList(),
    );
  }
}
