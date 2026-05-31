import 'package:flutter/material.dart';

import '../../../core/design/tokens/spacing.dart';
import '../../../core/localization/l10n.dart';
import '../../../core/repositories/member_repository.dart';
import '../../../core/widgets/mobile_tab_shell.dart';

class MembersScreen extends StatefulWidget {
  const MembersScreen({super.key});

  @override
  State<MembersScreen> createState() => _MembersScreenState();
}

class _MembersScreenState extends State<MembersScreen> {
  final _repository = MemberRepository();
  late Future<List<Map<String, dynamic>>> _membersFuture;

  @override
  void initState() {
    super.initState();
    _membersFuture = _repository.list();
  }

  Future<void> _refresh() async {
    setState(() {
      _membersFuture = _repository.list();
    });
    await _membersFuture;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final embedded = MobileTabShellScope.embeddedInShell(context);

    final body = RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<List<Map<String, dynamic>>>(
        future: _membersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                SizedBox(
                  height: MediaQuery.sizeOf(context).height * 0.4,
                  child: Center(child: Text(l10n.common_loading)),
                ),
              ],
            );
          }

          if (snapshot.hasError) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                SizedBox(
                  height: MediaQuery.sizeOf(context).height * 0.4,
                  child: Center(child: Text(l10n.error_network)),
                ),
              ],
            );
          }

          final members = snapshot.data ?? [];
          if (members.isEmpty) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                SizedBox(
                  height: MediaQuery.sizeOf(context).height * 0.4,
                  child: Center(child: Text(l10n.members_empty)),
                ),
              ],
            );
          }

          return ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(CmmsSpacing.md),
            itemCount: members.length,
            separatorBuilder: (_, __) => const SizedBox(height: CmmsSpacing.sm),
            itemBuilder: (context, index) {
              final member = members[index];
              final firstName = member['firstName']?.toString() ?? '';
              final lastName = member['lastName']?.toString() ?? '';
              final memberNumber = member['memberNumber']?.toString();
              final ministry = member['ministry']?.toString() ?? '';
              final status = member['status']?.toString() ?? 'ACTIVE';

              return Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Theme.of(context)
                        .colorScheme
                        .primary
                        .withValues(alpha: 0.12),
                    foregroundColor: Theme.of(context).colorScheme.primary,
                    child: Text(firstName.isNotEmpty ? firstName[0] : '?'),
                  ),
                  title: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (memberNumber != null && memberNumber.isNotEmpty)
                        Text(
                          memberNumber,
                          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      Text('$firstName $lastName'.trim()),
                    ],
                  ),
                  subtitle: Text('$ministry · $status'),
                  trailing: const Icon(Icons.more_vert),
                ),
              );
            },
          );
        },
      ),
    );

    if (embedded) {
      return body;
    }

    return Scaffold(
      appBar: AppBar(title: Text(l10n.members_title)),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
      body: body,
    );
  }
}
