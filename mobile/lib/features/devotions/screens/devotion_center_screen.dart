import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/l10n.dart';
import '../../choir/providers/choir_providers.dart';

class DevotionCenterScreen extends ConsumerStatefulWidget {
  const DevotionCenterScreen({super.key});

  @override
  ConsumerState<DevotionCenterScreen> createState() => _DevotionCenterScreenState();
}

class _DevotionCenterScreenState extends ConsumerState<DevotionCenterScreen> {
  Map<String, dynamic>? _widget;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final repo = ref.read(choirRepositoryProvider);
      final data = await repo.fetchDevotionWidget();
      if (mounted) setState(() => _widget = data);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.devotion_center_title)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_widget?['pinned'] != null)
                    _DevotionTile(
                      label: l10n.devotion_pinned,
                      item: Map<String, dynamic>.from(_widget!['pinned'] as Map),
                    ),
                  if (_widget?['verseOfDay'] != null)
                    _DevotionTile(
                      label: l10n.devotion_verse_of_day,
                      item: Map<String, dynamic>.from(_widget!['verseOfDay'] as Map),
                    ),
                  if (_widget?['encouragement'] != null)
                    _DevotionTile(
                      label: l10n.devotion_encouragement,
                      item: Map<String, dynamic>.from(_widget!['encouragement'] as Map),
                    ),
                ],
              ),
            ),
    );
  }
}

class _DevotionTile extends StatelessWidget {
  const _DevotionTile({required this.label, required this.item});

  final String label;
  final Map<String, dynamic> item;

  @override
  Widget build(BuildContext context) {
    final verse = item['verseReference'] as String?;
    final body = item['verseText'] as String? ?? item['content'] as String? ?? '';
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(height: 8),
            Text(item['title'] as String? ?? '', style: Theme.of(context).textTheme.titleMedium),
            if (verse != null) ...[
              const SizedBox(height: 4),
              Text(verse, style: Theme.of(context).textTheme.titleSmall),
            ],
            const SizedBox(height: 8),
            Text(body),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: '$verse\n$body'));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(context.l10n.devotion_share)),
                  );
                },
                icon: const Icon(Icons.share_outlined),
                label: Text(context.l10n.devotion_share),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
