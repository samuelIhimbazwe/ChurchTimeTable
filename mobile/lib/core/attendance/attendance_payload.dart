/// Maps UI operational marks to API attendance payloads.
class AttendancePayload {
  static Map<String, dynamic> forOperational({
    required String eventId,
    required String memberId,
    required String mark,
    String? reasonType,
    String? notes,
    int? lateMinutes,
  }) {
    switch (mark) {
      case 'ATTENDED':
        return {
          'eventId': eventId,
          'memberId': memberId,
          'physicalStatus': 'PRESENT',
          'operationalStatus': 'ATTENDED',
        };
      case 'LATE':
        return {
          'eventId': eventId,
          'memberId': memberId,
          'physicalStatus': 'LATE',
          'operationalStatus': 'LATE',
          if (lateMinutes != null) 'lateMinutes': lateMinutes,
        };
      case 'EXCUSED_ABSENCE':
        return {
          'eventId': eventId,
          'memberId': memberId,
          'physicalStatus': 'ABSENT',
          'reasonCategory': 'EXCUSED',
          'operationalStatus': 'EXCUSED_ABSENCE',
          if (reasonType != null) 'reasonType': reasonType,
          if (notes != null) 'excuseReason': notes,
          if (notes != null) 'notes': notes,
        };
      case 'UNEXCUSED_ABSENCE':
        return {
          'eventId': eventId,
          'memberId': memberId,
          'physicalStatus': 'ABSENT',
          'reasonCategory': 'UNEXCUSED',
          'operationalStatus': 'UNEXCUSED_ABSENCE',
          if (notes != null) 'notes': notes,
        };
      case 'REPLACEMENT_SERVED':
        return {
          'eventId': eventId,
          'memberId': memberId,
          'physicalStatus': 'PRESENT',
          'operationalStatus': 'REPLACEMENT_SERVED',
          'replacementType': 'LEADER_ASSIGNED',
          'countsAsOfficial': true,
          'voluntaryExtra': false,
        };
      case 'VOLUNTARY_EXTRA_SERVICE':
        return {
          'eventId': eventId,
          'memberId': memberId,
          'physicalStatus': 'PRESENT',
          'operationalStatus': 'VOLUNTARY_EXTRA_SERVICE',
          'replacementType': 'VOLUNTARY',
          'countsAsOfficial': false,
          'voluntaryExtra': true,
        };
      default:
        return {
          'eventId': eventId,
          'memberId': memberId,
          'physicalStatus': 'PRESENT',
          'operationalStatus': 'ATTENDED',
        };
    }
  }
}
