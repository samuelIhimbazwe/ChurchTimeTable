import '../../l10n/generated/app_localizations.dart';

/// Maps API enums to standardized church terminology (see docs/localization/).
extension ChurchLocalization on AppLocalizations {
  String swapStatusLabel(String status) {
    switch (status) {
      case 'REQUESTED':
        return swap_status_requested;
      case 'TARGET_ACCEPTED':
        return swap_status_target_accepted;
      case 'TARGET_REJECTED':
        return swap_status_target_rejected;
      case 'LEADER_PENDING':
        return swap_status_leader_pending;
      case 'APPROVED':
        return swap_status_approved;
      case 'REJECTED':
        return swap_status_rejected;
      case 'FINALIZED':
        return swap_status_finalized;
      case 'CANCELLED':
        return swap_status_cancelled;
      default:
        return enum_status_unknown;
    }
  }

  String replacementStatusLabel(String status) {
    switch (status) {
      case 'REQUESTED':
        return replacement_status_requested;
      case 'LEADER_PENDING':
        return replacement_status_leader_pending;
      case 'APPROVED':
        return replacement_status_approved;
      case 'REJECTED':
        return replacement_status_rejected;
      case 'FINALIZED':
        return replacement_status_finalized;
      default:
        return enum_status_unknown;
    }
  }

  String disciplineStageLabel(String stage) {
    switch (stage) {
      case 'REPORTED':
        return discipline_stage_reported;
      case 'UNDER_REVIEW':
        return discipline_stage_under_review;
      case 'DECISION_PENDING':
        return discipline_stage_decision_pending;
      case 'ACTIONED':
        return discipline_stage_actioned;
      case 'CLOSED':
        return discipline_stage_closed;
      default:
        return enum_status_unknown;
    }
  }

  String attendancePhysicalStatusLabel(String status) {
    switch (status) {
      case 'PRESENT':
        return attendance_status_present;
      case 'ABSENT':
        return attendance_status_absent;
      case 'LATE':
        return attendance_status_late;
      default:
        return enum_status_unknown;
    }
  }

  String eventTypeLabel(String type) {
    switch (type) {
      case 'CHOIR_SERVICE':
        return event_type_choir_service;
      case 'REHEARSAL':
        return term_rehearsal;
      case 'CONCERT':
        return event_type_concert;
      case 'PROTOCOL_SERVICE':
        return event_type_protocol_service;
      case 'CHURCH_EVENT':
        return event_type_church_event;
      default:
        return enum_status_unknown;
    }
  }

  String ministryScopeLabel(String scope) {
    switch (scope) {
      case 'CHOIR':
        return term_choir;
      case 'PROTOCOL':
        return term_protocol;
      case 'BOTH':
        return event_ministry_both;
      default:
        return enum_status_unknown;
    }
  }

  String attendanceReasonCategoryLabel(String? category) {
    switch (category) {
      case 'EXCUSED':
        return attendance_status_excused;
      case 'UNEXCUSED':
        return attendance_status_unexcused;
      default:
        return category == null || category.isEmpty
            ? ''
            : enum_status_unknown;
    }
  }
}
