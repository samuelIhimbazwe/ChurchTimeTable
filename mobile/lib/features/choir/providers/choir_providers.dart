import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/repositories/choir_repository.dart';
import '../../auth/providers/auth_provider.dart';

final choirRepositoryProvider = Provider<ChoirRepository>((ref) {
  return ChoirRepository(ref.read(apiClientProvider).dio);
});

final devotionWidgetProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(choirRepositoryProvider).fetchDevotionWidget();
});
