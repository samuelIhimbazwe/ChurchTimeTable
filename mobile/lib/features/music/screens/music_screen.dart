import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/routing/app_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../choir/providers/choir_providers.dart';
import 'music_favorites_screen.dart';
import 'song_detail_screen.dart';

class MusicScreen extends ConsumerStatefulWidget {
  const MusicScreen({super.key});

  @override
  ConsumerState<MusicScreen> createState() => _MusicScreenState();
}

class _MusicScreenState extends ConsumerState<MusicScreen> {
  List<Map<String, dynamic>> _songs = const [];
  List<Map<String, dynamic>> _recent = const [];
  String? _error;
  bool _loading = true;
  bool _offline = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _offline = false;
    });
    try {
      final api = ref.read(apiClientProvider);
      await api.loadToken();
      final repo = ref.read(choirRepositoryProvider);
      final items = await repo.fetchSongs();
      final recent = await repo.readRecentSongs();
      setState(() {
        _songs = items;
        _recent = recent;
        _loading = false;
      });
    } catch (e) {
      final repo = ref.read(choirRepositoryProvider);
      final items = await repo.fetchSongs(offlineFallback: true);
      setState(() {
        _songs = items;
        _error = items.isEmpty ? e.toString() : null;
        _offline = items.isNotEmpty;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(Spacing.md),
                children: [
                  if (_offline) Text(l10n.welfare_offline_banner),
                  if (_error != null) Text(_error!),
                  Row(
                    children: [
                      FilledButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const MusicFavoritesScreen()),
                          );
                        },
                        child: Text(l10n.music_favorites),
                      ),
                    ],
                  ),
                  if (_recent.isNotEmpty) ...[
                    Text(l10n.music_recent, style: Theme.of(context).textTheme.titleSmall),
                    ..._recent.take(5).map(
                          (r) => CmmsCard(
                            title: r['id']?.toString() ?? '',
                            leading: const Icon(Icons.history),
                            onTap: () => _openSong(r['id']?.toString() ?? ''),
                          ),
                        ),
                    const Divider(),
                  ],
                  ..._songs.map(
                    (song) => Padding(
                      padding: const EdgeInsets.only(bottom: Spacing.xs),
                      child: CmmsCard(
                        title: song['title']?.toString() ?? '',
                        subtitle: song['composer']?.toString(),
                        leading: const Icon(Icons.library_music_outlined),
                        trailing: Text('${song['usageCount'] ?? 0}'),
                        onTap: () => _openSong(song['id'].toString()),
                      ),
                    ),
                  ),
                ],
              ),
    );
  }

  void _openSong(String songId) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => SongDetailScreen(songId: songId),
      ),
    );
  }
}
