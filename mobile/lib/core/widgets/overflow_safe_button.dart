import 'package:flutter/material.dart';
import '../design/components/buttons/cmms_button.dart';

/// @deprecated Prefer [CmmsButton] from `package:cmms_mobile/core/design/design.dart`.
class OverflowSafeButton extends StatelessWidget {
  const OverflowSafeButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return CmmsButton(
      label: label,
      onPressed: onPressed,
      icon: icon,
      expanded: true,
    );
  }
}
