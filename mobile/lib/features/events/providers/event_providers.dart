import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/locale_provider.dart';
import '../../../core/repositories/event_repository.dart';

final eventRepositoryProvider = Provider<EventRepository>((ref) {
  return EventRepository(client: ref.watch(apiClientProvider));
});

final eventsListProvider =
    FutureProvider.family<List<Map<String, dynamic>>, EventListFilter>(
  (ref, filter) async {
    final repo = ref.watch(eventRepositoryProvider);
    return repo.list(
      type: filter.type,
      ministryScope: filter.ministryScope,
      from: filter.from,
      to: filter.to,
      preferCache: filter.preferCache,
    );
  },
);

final eventDetailProvider = FutureProvider.family<Map<String, dynamic>, String>(
  (ref, id) async {
    final repo = ref.watch(eventRepositoryProvider);
    return repo.findOne(id, preferCache: true);
  },
);

final eventAuditProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>(
  (ref, eventId) async {
    final repo = ref.watch(eventRepositoryProvider);
    return repo.auditForEvent(eventId);
  },
);

class EventListFilter {
  const EventListFilter({
    this.type,
    this.ministryScope,
    this.from,
    this.to,
    this.preferCache = false,
  });

  final String? type;
  final String? ministryScope;
  final String? from;
  final String? to;
  final bool preferCache;

  @override
  bool operator ==(Object other) =>
      other is EventListFilter &&
      other.type == type &&
      other.ministryScope == ministryScope &&
      other.from == from &&
      other.to == to &&
      other.preferCache == preferCache;

  @override
  int get hashCode => Object.hash(type, ministryScope, from, to, preferCache);
}
