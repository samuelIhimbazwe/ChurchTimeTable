import 'package:flutter/material.dart';

import '../../../core/api/api_client.dart';

class AssetDetailScreen extends StatefulWidget {
  const AssetDetailScreen({super.key, required this.assetId});

  final String assetId;

  @override
  State<AssetDetailScreen> createState() => _AssetDetailScreenState();
}

class _AssetDetailScreenState extends State<AssetDetailScreen> {
  Map<String, dynamic>? _asset;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final client = ApiClient();
      final res = await client.get('/assets/${widget.assetId}');
      setState(() {
        _asset = res.data['data'] as Map<String, dynamic>?;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Asset detail')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _asset == null
              ? const Center(child: Text('Asset not found'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text(
                      '${_asset!['code']} — ${_asset!['name']}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text('Status: ${_asset!['status']}'),
                    Text('Condition: ${_asset!['condition']}'),
                    const Divider(),
                    const Text('Ownership, custody, and assignments — see web tabs for full MF-4 UI.'),
                  ],
                ),
    );
  }
}
