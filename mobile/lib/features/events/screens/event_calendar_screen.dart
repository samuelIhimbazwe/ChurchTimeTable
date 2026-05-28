import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../../core/design/components/lists/event_tile.dart';
import '../../../core/design/tokens/ministry_accents.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/church_localization.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/localization/locale_date_format.dart';
import '../../../core/localization/locale_provider.dart';
import '../providers/event_providers.dart';
import 'event_create_screen.dart';
import 'event_detail_screen.dart';

enum _CalendarView { month, week }

class EventCalendarScreen extends ConsumerStatefulWidget {
  const EventCalendarScreen({super.key});

  @override
  ConsumerState<EventCalendarScreen> createState() =>
      _EventCalendarScreenState();
}

class _EventCalendarScreenState extends ConsumerState<EventCalendarScreen> {
  DateTime _focused = DateTime.now();
  _CalendarView _view = _CalendarView.month;
  String? _typeFilter;
  String? _ministryFilter;

  EventListFilter get _filter => EventListFilter(
        type: _typeFilter,
        ministryScope: _ministryFilter,
        preferCache: true,
      );

  List<Map<String, dynamic>> _eventsOnDay(
    List<Map<String, dynamic>> events,
    DateTime day,
  ) {
    return events.where((e) {
      final start = DateTime.parse(e['startTime'] as String);
      return isSameDay(start, day);
    }).toList();
  }

  List<Map<String, dynamic>> _eventsInWeek(
    List<Map<String, dynamic>> events,
    DateTime anchor,
  ) {
    final start = anchor.subtract(Duration(days: anchor.weekday - 1));
    final end = start.add(const Duration(days: 7));
    return events.where((e) {
      final t = DateTime.parse(e['startTime'] as String);
      return !t.isBefore(start) && t.isBefore(end);
    }).toList()
      ..sort(
        (a, b) => DateTime.parse(a['startTime'] as String)
            .compareTo(DateTime.parse(b['startTime'] as String)),
      );
  }

  Future<void> _refreshEvents() async {
    ref.invalidate(eventsListProvider(_filter));
  }

  Widget _buildViewToggle(BuildContext context) {
    final l10n = context.l10n;

    return SegmentedButton<_CalendarView>(
      segments: [
        ButtonSegment(
          value: _CalendarView.month,
          label: Text(l10n.event_view_month),
        ),
        ButtonSegment(
          value: _CalendarView.week,
          label: Text(l10n.event_view_week),
        ),
      ],
      selected: {_view},
      onSelectionChanged: (selection) => setState(() => _view = selection.first),
    );
  }

  Widget _buildFilters(BuildContext context) {
    final l10n = context.l10n;

    return Wrap(
      spacing: CmmsSpacing.xs,
      runSpacing: CmmsSpacing.xs,
      children: [
        SizedBox(
          width: 280,
          child: DropdownButtonFormField<String?>(
            value: _typeFilter,
            isExpanded: true,
            decoration: InputDecoration(
              labelText: l10n.term_schedule,
              isDense: true,
            ),
            items: [
              DropdownMenuItem(
                value: null,
                child: Text(l10n.event_filter_all_types),
              ),
              ...[
                'CHOIR_SERVICE',
                'REHEARSAL',
                'CONCERT',
                'PROTOCOL_SERVICE',
                'CHURCH_EVENT',
              ].map(
                (type) => DropdownMenuItem(
                  value: type,
                  child: Text(l10n.eventTypeLabel(type)),
                ),
              ),
            ],
            onChanged: (value) {
              setState(() => _typeFilter = value);
              ref.invalidate(
                eventsListProvider(
                  EventListFilter(
                    type: value,
                    ministryScope: _ministryFilter,
                    preferCache: true,
                  ),
                ),
              );
            },
          ),
        ),
        SizedBox(
          width: 280,
          child: DropdownButtonFormField<String?>(
            value: _ministryFilter,
            isExpanded: true,
            decoration: InputDecoration(
              labelText: l10n.term_committee,
              isDense: true,
            ),
            items: [
              DropdownMenuItem(
                value: null,
                child: Text(l10n.event_filter_ministry_all),
              ),
              ...['CHOIR', 'PROTOCOL', 'BOTH'].map(
                (ministry) => DropdownMenuItem(
                  value: ministry,
                  child: Text(l10n.ministryScopeLabel(ministry)),
                ),
              ),
            ],
            onChanged: (value) {
              setState(() => _ministryFilter = value);
              ref.invalidate(
                eventsListProvider(
                  EventListFilter(
                    type: _typeFilter,
                    ministryScope: value,
                    preferCache: true,
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildEventList(
    BuildContext context, {
    required String lang,
    required List<Map<String, dynamic>> visibleEvents,
  }) {
    final l10n = context.l10n;

    return RefreshIndicator(
      onRefresh: _refreshEvents,
      child: ListView.builder(
        itemCount: visibleEvents.length,
        itemBuilder: (_, i) {
          final event = visibleEvents[i];
          final start = DateTime.parse(event['startTime'] as String);
          return EventTile(
            title: event['title'] as String? ?? '',
            subtitle:
                '${l10n.eventTypeLabel(event['type'] as String? ?? '')} · ${LocaleDateFormat.formatTime(start, lang)}',
            ministry: MinistryAccents.fromApi(
              event['ministryScope'] as String?,
            ),
            statusLabel: l10n.ministryScopeLabel(
              event['ministryScope'] as String? ?? '',
            ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => EventDetailScreen(
                    eventId: event['id'] as String,
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final lang = ref.watch(localeProvider).languageCode;
    final eventsAsync = ref.watch(eventsListProvider(_filter));

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.nav_calendar),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: l10n.event_create_title,
            onPressed: () async {
              final created = await Navigator.push<bool>(
                context,
                MaterialPageRoute(builder: (_) => const EventCreateScreen()),
              );
              if (created == true) {
                ref.invalidate(eventsListProvider(_filter));
              }
            },
          ),
        ],
      ),
      body: eventsAsync.when(
        loading: () => Center(child: Text(l10n.common_loading)),
        error: (_, __) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(l10n.error_network, textAlign: TextAlign.center),
              TextButton(
                onPressed: () => ref.invalidate(eventsListProvider(_filter)),
                child: Text(l10n.common_refresh),
              ),
            ],
          ),
        ),
        data: (events) {
          final isDesktop = MediaQuery.sizeOf(context).width >= 1100;
          final dayEvents = _eventsOnDay(events, _focused);
          final weekEvents = _eventsInWeek(events, _focused);
          final visibleEvents =
              _view == _CalendarView.month ? dayEvents : weekEvents;

          final calendarContent = _view == _CalendarView.month
              ? TableCalendar(
                  firstDay: DateTime.utc(2024),
                  lastDay: DateTime.utc(2030, 12, 31),
                  focusedDay: _focused,
                  selectedDayPredicate: (day) => isSameDay(_focused, day),
                  onDaySelected: (selected, focused) =>
                      setState(() => _focused = selected),
                  eventLoader: (day) => _eventsOnDay(events, day),
                )
              : Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    LocaleDateFormat.formatDate(_focused, lang),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                );

          final listLabel = _view == _CalendarView.month
              ? l10n.calendar_selected_day
              : l10n.event_view_week;

          if (isDesktop) {
            return Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1240),
                child: Padding(
                  padding: const EdgeInsets.all(CmmsSpacing.md),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 6,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildViewToggle(context),
                            const SizedBox(height: CmmsSpacing.sm),
                            _buildFilters(context),
                            const SizedBox(height: CmmsSpacing.sm),
                            Card(
                              child: Padding(
                                padding: const EdgeInsets.all(CmmsSpacing.sm),
                                child: calendarContent,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: CmmsSpacing.md),
                      Expanded(
                        flex: 5,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: CmmsSpacing.xs,
                              ),
                              child: Text(
                                listLabel,
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                            ),
                            const SizedBox(height: CmmsSpacing.xs),
                            Expanded(
                              child: Card(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: CmmsSpacing.xs,
                                  ),
                                  child: _buildEventList(
                                    context,
                                    lang: lang,
                                    visibleEvents: visibleEvents,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: CmmsSpacing.sm),
                child: _buildViewToggle(context),
              ),
              Padding(
                padding: const EdgeInsets.all(CmmsSpacing.sm),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: _buildFilters(context),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: CmmsSpacing.sm),
                child: calendarContent,
              ),
              Padding(
                padding: const EdgeInsets.all(CmmsSpacing.xs),
                child: Text(
                  listLabel,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
              Expanded(
                child: _buildEventList(
                  context,
                  lang: lang,
                  visibleEvents: visibleEvents,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
