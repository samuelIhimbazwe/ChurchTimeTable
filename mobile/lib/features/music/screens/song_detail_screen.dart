import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';

class SongDetailScreen extends ConsumerStatefulWidget {
  const SongDetailScreen({super.key, required this.songId});

  final String songId;

  @override
  ConsumerState<SongDetailScreen> createState() => _SongDetailScreenState();
}

class _SongDetailScreenState extends ConsumerState<SongDetailScreen> {
  Map<String, dynamic>? _song;
  bool _loading = true;
  bool _offline = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final repo = ref.read(choirRepositoryProvider);
      final data = await repo.fetchSong(widget.songId);
      await repo.trackRecentSong(widget.songId);
      setState(() {
        _song = data;
        _loading = false;
        _offline = false;
      });
    } catch (_) {
      final data = await ref.read(choirRepositoryProvider).fetchSong(
            widget.songId,
            offlineFallback: true,
          );
      setState(() {
        _song = data.isNotEmpty ? data : null;
        _offline = data.isNotEmpty;
        _loading = false;
      });
    }
  }

  Future<void> _toggleFavorite() async {
    final api = ref.read(apiClientProvider);
    await api.loadToken();
    await ref.read(choirRepositoryProvider).toggleSongFavorite(widget.songId);
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isFavorite = _song?['isFavorite'] == true;
    final assets = (_song?['assets'] as List? ?? const [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();

    return Scaffold(
      appBar: AppBar(title: Text(_song?['title']?.toString() ?? l10n.music_title)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(Spacing.md),
              children: [
                if (_offline) Text(l10n.welfare_offline_banner),
                if (_song != null) ...[
                  FilledButton(
                    onPressed: _toggleFavorite,
                    child: Text(isFavorite ? l10n.music_unfavorite : l10n.music_favorite),
                  ),
                  const SizedBox(height: Spacing.md),
                  Text(l10n.music_lyrics, style: Theme.of(context).textTheme.titleMedium),
                  Text(_song!['lyricsText']?.toString() ?? '—'),
                  if (assets.isNotEmpty) ...[
                    const SizedBox(height: Spacing.md),
                    Text(l10n.music_assets, style: Theme.of(context).textTheme.titleMedium),
                    ...assets.map((asset) {
                      final url = asset['fileUrl']?.toString() ?? '';
                      final mime = asset['mimeType']?.toString() ?? '';
                      if (mime.startsWith('audio/')) {
                        return ListTile(
                          title: Text(asset['fileName']?.toString() ?? ''),
                          subtitle: Text(url),
                        );
                      }
                      if (mime.contains('pdf')) {
                        return ListTile(
                          title: Text(asset['fileName']?.toString() ?? ''),
                          trailing: const Icon(Icons.picture_as_pdf),
                        );
                      }
                      return ListTile(title: Text(asset['fileName']?.toString() ?? ''));
                    }),
                  ],
                ],
              ],
            ),
    );
  }
}
