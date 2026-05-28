import 'package:flutter_test/flutter_test.dart';
import 'package:cmms_mobile/features/events/providers/event_providers.dart';

void main() {
  group('EventListFilter', () {
    test('equality for provider family', () {
      const a = EventListFilter(type: 'CHOIR_SERVICE', ministryScope: 'CHOIR');
      const b = EventListFilter(type: 'CHOIR_SERVICE', ministryScope: 'CHOIR');
      const c = EventListFilter(type: 'REHEARSAL');
      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
      expect(a == c, isFalse);
    });
  });
}
