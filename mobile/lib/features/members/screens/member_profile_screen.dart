import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/design/components/cards/cmms_card.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/repositories/member_repository.dart';
import '../../auth/providers/auth_provider.dart';

class MemberProfileScreen extends ConsumerStatefulWidget {
  const MemberProfileScreen({super.key, required this.memberId});

  final String memberId;

  @override
  ConsumerState<MemberProfileScreen> createState() => _MemberProfileScreenState();
}

class _MemberProfileScreenState extends ConsumerState<MemberProfileScreen> {
  final _repository = MemberRepository();
  Map<String, dynamic>? _center;
  List<dynamic>? _timeline;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final center = await _repository.profileCenter(widget.memberId);
      final timeline = await _repository.timeline(widget.memberId, limit: 50);
      setState(() {
        _center = center;
        _timeline = timeline;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.member_profile_title),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? Center(child: Text(l10n.common_loading))
          : _error != null
              ? Center(child: Text(_error!))
              : _center == null
                  ? Center(child: Text(l10n.error_network))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.all(CmmsSpacing.md),
                        children: [
                          _HeaderCard(center: _center!),
                          const SizedBox(height: CmmsSpacing.md),
                          _StatsRow(center: _center!),
                          const SizedBox(height: CmmsSpacing.md),
                          CmmsCard(
                            title: l10n.member_profile_timeline,
                            child: (_timeline ?? []).isEmpty
                                ? Text(l10n.member_profile_timeline_empty)
                                : Column(
                                    children: (_timeline ?? [])
                                        .take(25)
                                        .map(
                                          (event) => ListTile(
                                            title: Text(
                                              '${event['title'] ?? ''}',
                                            ),
                                            subtitle: Text(
                                              '${event['summary'] ?? ''}',
                                            ),
                                            trailing: Text(
                                              '${event['type'] ?? ''}',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .labelSmall,
                                            ),
                                          ),
                                        )
                                        .toList(),
                                  ),
                          ),
                        ],
                      ),
                    ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.center});

  final Map<String, dynamic> center;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final member = center['member'] as Map<String, dynamic>? ?? {};
    final profile = center['profile'] as Map<String, dynamic>?;
    final family = center['family'] as Map<String, dynamic>?;

    return CmmsCard(
      title:
          '${member['firstName'] ?? ''} ${member['lastName'] ?? ''}'.trim(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${l10n.member_profile_status}: ${member['status'] ?? ''}'),
          if (profile?['voicePart'] != null)
            Text('${l10n.member_profile_voice}: ${profile!['voicePart']}'),
          if (family != null)
            Text(
              '${l10n.member_profile_family}: ${family['familyName']} (${family['familyCode']})',
            ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.center});

  final Map<String, dynamic> center;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final dashboard = center['dashboard'] as Map<String, dynamic>? ?? {};
    final score = dashboard['attendanceScore'] as Map<String, dynamic>?;
    final contributions =
        dashboard['contributionSummary'] as Map<String, dynamic>?;
    final welfare = dashboard['welfareSummary'] as Map<String, dynamic>?;

    return Column(
      children: [
        if (score != null)
          CmmsCard(
            title: l10n.dashboard_kpi_attendance_rate,
            child: Text('${score['percentage']}% — ${score['bandLabel']}'),
          ),
        if (contributions != null) ...[
          const SizedBox(height: CmmsSpacing.sm),
          CmmsCard(
            title: l10n.my_contributions_title,
            child: Text(
              '${contributions['confirmedEffectiveTotal']} (${contributions['confirmedCount']})',
            ),
          ),
        ],
        if (welfare != null) ...[
          const SizedBox(height: CmmsSpacing.sm),
          CmmsCard(
            title: l10n.member_profile_welfare,
            child: Text('${welfare['openCases']}'),
          ),
        ],
      ],
    );
  }
}

/// Route helper: opens own profile when [memberId] is omitted.
class MyMemberProfileScreen extends ConsumerWidget {
  const MyMemberProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final memberId = auth.profile?['member']?['id']?.toString();
    if (memberId == null || memberId.isEmpty) {
      return Scaffold(
        body: Center(child: Text(context.l10n.error_network)),
      );
    }
    return MemberProfileScreen(memberId: memberId);
  }
}
