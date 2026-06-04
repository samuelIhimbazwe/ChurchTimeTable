import 'package:flutter/material.dart';

import '../../../core/api/api_client.dart';
import '../assets_cache.dart';

class AssetsScreen extends StatefulWidget {
  const AssetsScreen({super.key});

  @override
  State<AssetsScreen> createState() => _AssetsScreenState();
}

class _AssetsScreenState extends State<AssetsScreen> {
  final _cache = AssetsCache();
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final client = ApiClient();
      final res = await client.get('/assets');
      final data = res.data['data'] as List<dynamic>? ?? [];
      await _cache.saveAssets(data);
      setState(() {
        _items = data;
        _loading = false;
      });
    } catch (_) {
      final cached = await _cache.loadAssets();
      setState(() {
        _items = cached;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Assets')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _items.length,
              itemBuilder: (context, index) {
                final item = _items[index] as Map<String, dynamic>;
                final id = item['id'] as String? ?? '';
                final code = item['code'] as String? ?? '';
                final name = item['name'] as String? ?? '';
                return ListTile(
                  title: Text('$code — $name'),
                  subtitle: Text('${item['status']} · ${item['condition']}'),
                  onTap: () => Navigator.pushNamed(
                    context,
                    '/assets/detail',
                    arguments: id,
                  ),
                );
              },
            ),
    );
  }
}
