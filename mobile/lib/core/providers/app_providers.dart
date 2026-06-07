import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../localization/locale_provider.dart';
import '../services/sync_service.dart';

export '../localization/locale_provider.dart' show apiClientProvider;

final syncServiceProvider = Provider<SyncService>((ref) {
  return SyncService(client: ref.watch(apiClientProvider));
});
