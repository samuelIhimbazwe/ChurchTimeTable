import 'package:flutter/material.dart';
import '../../../localization/l10n.dart';
import '../../tokens/colors.dart';
import 'cmms_chip.dart';

enum AttendanceChipStatus {
  present,
  absent,
  late,
  excused,
  unexcused,
  attended,
  replacementServed,
  voluntaryExtra,
}

/// Localized attendance status chip with church-native labels.
class AttendanceStatusChip extends StatelessWidget {
  const AttendanceStatusChip({
    super.key,
    required this.status,
    this.compact = false,
  });

  final AttendanceChipStatus status;
  final bool compact;

  factory AttendanceStatusChip.fromPhysical(
    BuildContext context,
    String physicalStatus, {
    String? reasonCategory,
    bool compact = false,
  }) {
    if (reasonCategory == 'EXCUSED') {
      return AttendanceStatusChip(
        status: AttendanceChipStatus.excused,
        compact: compact,
      );
    }
    if (reasonCategory == 'UNEXCUSED') {
      return AttendanceStatusChip(
        status: AttendanceChipStatus.unexcused,
        compact: compact,
      );
    }
    switch (physicalStatus) {
      case 'PRESENT':
        return AttendanceStatusChip(
          status: AttendanceChipStatus.present,
          compact: compact,
        );
      case 'ABSENT':
        return AttendanceStatusChip(
          status: AttendanceChipStatus.absent,
          compact: compact,
        );
      case 'LATE':
        return AttendanceStatusChip(
          status: AttendanceChipStatus.late,
          compact: compact,
        );
      default:
        return AttendanceStatusChip(
          status: AttendanceChipStatus.present,
          compact: compact,
        );
    }
  }

  factory AttendanceStatusChip.fromOperational(
    BuildContext context,
    String operationalStatus, {
    bool compact = false,
  }) {
    switch (operationalStatus) {
      case 'ATTENDED':
        return AttendanceStatusChip(
          status: AttendanceChipStatus.attended,
          compact: compact,
        );
      case 'LATE':
        return AttendanceStatusChip(
          status: AttendanceChipStatus.late,
          compact: compact,
        );
      case 'EXCUSED_ABSENCE':
        return AttendanceStatusChip(
          status: AttendanceChipStatus.excused,
          compact: compact,
        );
      case 'UNEXCUSED_ABSENCE':
        return AttendanceStatusChip(
          status: AttendanceChipStatus.unexcused,
          compact: compact,
        );
      case 'REPLACEMENT_SERVED':
        return AttendanceStatusChip(
          status: AttendanceChipStatus.replacementServed,
          compact: compact,
        );
      case 'VOLUNTARY_EXTRA_SERVICE':
        return AttendanceStatusChip(
          status: AttendanceChipStatus.voluntaryExtra,
          compact: compact,
        );
      default:
        return AttendanceStatusChip.fromPhysical(
          context,
          'PRESENT',
          compact: compact,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final (label, color, icon) = _resolve(l10n, status);

    return CmmsChip(
      label: label,
      color: color,
      icon: icon,
    );
  }

  (String, Color, IconData) _resolve(
    dynamic l10n,
    AttendanceChipStatus s,
  ) {
    switch (s) {
      case AttendanceChipStatus.present:
        return (l10n.attendance_status_present, CmmsColors.success, Icons.check_circle_outline);
      case AttendanceChipStatus.absent:
        return (l10n.attendance_status_absent, CmmsColors.danger, Icons.cancel_outlined);
      case AttendanceChipStatus.late:
        return (l10n.attendance_status_late, CmmsColors.warning, Icons.schedule);
      case AttendanceChipStatus.excused:
        return (l10n.attendance_status_excused, CmmsColors.info, Icons.info_outline);
      case AttendanceChipStatus.unexcused:
        return (l10n.attendance_status_unexcused, CmmsColors.danger, Icons.warning_amber_outlined);
      case AttendanceChipStatus.attended:
        return (l10n.attendance_status_attended, CmmsColors.success, Icons.check_circle);
      case AttendanceChipStatus.replacementServed:
        return (l10n.attendance_status_replacement, CmmsColors.info, Icons.swap_horiz);
      case AttendanceChipStatus.voluntaryExtra:
        return (l10n.attendance_status_voluntary, CmmsColors.info, Icons.volunteer_activism_outlined);
    }
  }
}
