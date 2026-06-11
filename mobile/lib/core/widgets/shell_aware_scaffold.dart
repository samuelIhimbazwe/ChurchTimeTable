import 'package:flutter/material.dart';

import 'mobile_tab_shell.dart';

/// Hides duplicate AppBar when the screen is rendered inside [AppShell].
class ShellAwareScaffold extends StatelessWidget {
  const ShellAwareScaffold({
    super.key,
    required this.title,
    required this.body,
    this.actions,
    this.floatingActionButton,
  });

  final String title;
  final Widget body;
  final List<Widget>? actions;
  final Widget? floatingActionButton;

  @override
  Widget build(BuildContext context) {
    final embedded = MobileTabShellScope.embeddedInShell(context);

    if (embedded) {
      final hasActions = actions != null && actions!.isNotEmpty;
      Widget content = body;

      if (hasActions) {
        content = Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.only(right: 4, top: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: actions!,
                ),
              ),
            ),
            Expanded(child: body),
          ],
        );
      }

      if (floatingActionButton != null) {
        return Stack(
          children: [
            Positioned.fill(child: content),
            Positioned(
              right: 16,
              bottom: 16,
              child: floatingActionButton!,
            ),
          ],
        );
      }

      return content;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: actions,
      ),
      body: body,
      floatingActionButton: floatingActionButton,
    );
  }
}
