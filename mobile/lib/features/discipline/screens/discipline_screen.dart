import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_response.dart';
import '../../../core/design/components/banners/discipline_banner.dart';
import '../../../core/design/components/lists/cmms_list_tile.dart';
import '../../../core/design/layout/adaptive_spacing.dart';
import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/localization/locale_provider.dart';

class DisciplineScreen extends ConsumerStatefulWidget {
  const DisciplineScreen({super.key});

  @override
  ConsumerState<DisciplineScreen> createState() => _DisciplineScreenState();
}

class _DisciplineScreenState extends ConsumerState<DisciplineScreen> {
  List<Map<String, dynamic>> _cases = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = ref.read(apiClientProvider);
    try {
      await api.loadToken();
      final res = await api.dio.get('/discipline');
      final parsed = ApiResponse<Map<String, dynamic>>.fromJson(
        res.data as Map<String, dynamic>,
        (d) => Map<String, dynamic>.from(d as Map),
      );
      setState(() {
        _cases = (parsed.data?['items'] as List?)
                ?.map((c) => Map<String, dynamic>.from(c as Map))
                .toList() ??
            [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  DisciplineBannerTone _toneForStage(String stage) {
    switch (stage) {
      case 'UNDER_REVIEW':
      case 'DECISION_PENDING':
        return DisciplineBannerTone.underReview;
      case 'ACTIONED':
        return DisciplineBannerTone.warning;
      default:
        return DisciplineBannerTone.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.discipline_title)),
      body: _loading
          ? Center(child: Text(l10n.common_loading))
          : ListView(
              padding: AdaptiveSpacing.screen(context),
              children: [
                DisciplineBanner(
                  title: l10n.discipline_title,
                  message: l10n.discipline_case_opened(
                    _cases.isEmpty
                        ? '—'
                        : (_cases.first['title'] as String? ?? ''),
                  ),
                  tone: DisciplineBannerTone.info,
                ),
                const SizedBox(height: CmmsSpacing.md),
                ..._cases.map((c) {
                  final stage = c['stage'] as String? ?? '';
                  return Padding(
                    padding: const EdgeInsets.only(bottom: CmmsSpacing.xs),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (stage == 'UNDER_REVIEW' ||
                            stage == 'DECISION_PENDING')
                          Padding(
                            padding: const EdgeInsets.only(
                              bottom: CmmsSpacing.xs,
                            ),
                            child: DisciplineBanner(
                              message: l10n.disciplineStageLabel(stage),
                              tone: _toneForStage(stage),
                            ),
                          ),
                        Card(
                          child: CmmsListTile(
                            title: c['title']?.toString() ?? '',
                            subtitle: l10n.disciplineStageLabel(stage),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
    );
  }
}
