import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';
import 'song_detail_screen.dart';

class MusicFavoritesScreen extends ConsumerStatefulWidget {
  const MusicFavoritesScreen({super.key});

  @override
  ConsumerState<MusicFavoritesScreen> createState() => _MusicFavoritesScreenState();
}

class _MusicFavoritesScreenState extends ConsumerState<MusicFavoritesScreen> {
  List<Map<String, dynamic>> _items = const [];
  bool _loading = true;

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
      final items = await ref.read(choirRepositoryProvider).fetchMusicFavorites();
      setState(() {
        _items = items;
        _loading = false;
      });
    } catch (_) {
      final items = await ref.read(choirRepositoryProvider).fetchMusicFavorites(offlineFallback: true);
      setState(() {
        _items = items;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.music_favorites)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.all(Spacing.md),
                itemCount: _items.length,
                itemBuilder: (_, i) {
                  final song = _items[i];
                  return ListTile(
                    title: Text(song['title']?.toString() ?? ''),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => SongDetailScreen(songId: song['id'].toString()),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
    );
  }
}
