import 'package:flutter/material.dart';
import '../tokens/spacing.dart';

/// Mobile-first breakpoints for CMMS (Android phones primary).
abstract final class CmmsBreakpoints {
  static const double compact = 360;
  static const double medium = 400;
  static const double expanded = 600;
}

class CmmsResponsive {
  CmmsResponsive._(this.width);

  final double width;

  factory CmmsResponsive.of(BuildContext context) =>
      CmmsResponsive._(MediaQuery.sizeOf(context).width);

  bool get isCompact => width < CmmsBreakpoints.compact;
  bool get isMedium =>
      width >= CmmsBreakpoints.compact && width < CmmsBreakpoints.expanded;
  bool get isExpanded => width >= CmmsBreakpoints.expanded;

  int get gridColumns {
    if (isExpanded) return 3;
    if (isMedium) return 2;
    return 2;
  }

  double get screenPadding =>
      isCompact ? CmmsSpacing.sm : CmmsSpacing.screenPadding;
}
