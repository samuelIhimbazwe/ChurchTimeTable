export const rwMessages: Record<string, string> = {

  INTERNAL_ERROR: 'Habaye ikosa ritunguranye. Ongera ugerageze.',

  BAD_REQUEST: 'Ubusabe ntibwemewe.',

  UNAUTHORIZED: "Ntushobora kwinjira. Reba imeri n'ijambo banga.",

  FORBIDDEN: 'Nta burenganzira ufite bwo gukora ibi.',

  NOT_FOUND: 'Ibyo usabye ntibibonetse.',

  VALIDATION_ERROR: 'Amakuru winjije si yo.',

  CONFLICT: "Habonetse ikibazo cyo guhura kw'amasaha cyangwa gahunda.",

  BUSINESS_RULE_VIOLATION: "Iki gikorwa nticyemewe mu mategeko y'itorero.",

  SCHEDULE_OVERLAP: 'Uyu munyamuryango amaze gahunda mu gihe kimwe.',

  DOUBLE_BOOKING: 'Uyu munyamuryango amaze gushyirwa kuri iki gikorwa.',

  PROTOCOL_QUOTA_FULL: "Uyu serivisi y'ubuprotocole yuzuye (abanyamuryango 12).",

  PROTOCOL_MONTHLY_LIMIT: "Uyu munyamuryango ageze ku serivisi 3 z'ukwezi.",

  MINISTRY_CONFLICT: "Uyu munyamuryango ntabwo ari mu murimo w'iki gikorwa.",

  CHILDREN_CHOIR_SERVICE1: "Serivisi ya mbere ni iy'abana gusa.",

  ATTENDANCE_LOCKED: 'Kwitabira cyamaze gufungwa nyuma y\'amasegonda 48.',

  SWAP_NOT_ALLOWED: 'Gusimburana ntibyemewe kuri iki gikorwa.',

  NOTIFICATION_EVENT_ASSIGNMENT_TITLE: 'Inshingano nshya',

  NOTIFICATION_EVENT_ASSIGNMENT_BODY:

    'Washyizwe ku gikorwa: {eventName}',

  NOTIFICATION_SWAP_TITLE: 'Gusimburana',

  NOTIFICATION_SWAP_REQUESTED_BODY:

    '{memberName} yasabye ko musimburana',

  NOTIFICATION_SWAP_ACCEPTED_BODY:

    '{memberName} yemeye gusimburana',

  NOTIFICATION_SWAP_REJECTED_BODY:

    '{memberName} yanze gusimburana',

  NOTIFICATION_SWAP_APPROVED_BODY:

    "Umuyobozi yemeje gusimburana kwa {memberName}",

  NOTIFICATION_SWAP_FINALIZED_BODY:

    'Gusimburana byarangiye: {eventName}',

  NOTIFICATION_SWAP_PENDING_LEADER_TITLE: 'Swap itegereje review',

  NOTIFICATION_SWAP_PENDING_LEADER_BODY:

    'Swap isaba review ya Team Head kuri {eventName}',

  NOTIFICATION_REPLACEMENT_TITLE: 'Amakuru ya replacement',

  NOTIFICATION_REPLACEMENT_REQUESTED_BODY:

    'Replacement yasabwe kuri {eventName}',

  NOTIFICATION_REPLACEMENT_COVER_ASSIGNED_BODY:

    '{memberName} yiyemeje gukora kuri {eventName}',

  NOTIFICATION_REPLACEMENT_APPROVED_BODY:

    'Replacement yemejwe kuri {eventName}',

  NOTIFICATION_REPLACEMENT_REJECTED_BODY:

    'Replacement yanze kuri {eventName}',

  NOTIFICATION_REPLACEMENT_FINALIZED_BODY:

    'Replacement yarangiye kuri {eventName}',

  NOTIFICATION_REPLACEMENT_PENDING_LEADER_TITLE: 'Replacement itegereje',

  NOTIFICATION_REPLACEMENT_PENDING_LEADER_BODY:

    'Replacement isaba review kuri {eventName}',

  NOTIFICATION_COVERAGE_ESCALATION_TITLE: 'Escalade ya coverage ({level})',

  NOTIFICATION_COVERAGE_ESCALATION_BODY:

    '{memberName} — {eventName}. {notes}',

  NOTIFICATION_READINESS_WARNING_TITLE: 'Iburira ryo gutegura service',

  NOTIFICATION_READINESS_WARNING_BODY:

    '{eventName} readiness: {status}',

  NOTIFICATION_ATTENDANCE_TITLE: 'Uko witabiriye',

  NOTIFICATION_ATTENDANCE_BODY:

    'Uko witabiriye kwawe kuri {eventName} byanditswe',

  NOTIFICATION_ATTENDANCE_ABSENCE_TITLE: 'Gukurikirana attendance birakenewe',

  NOTIFICATION_ATTENDANCE_ABSENCE_BODY:

    'Absence yanditswe kuri {eventName}',

  NOTIFICATION_ATTENDANCE_ESCALATION_TITLE: 'Escalation ya attendance ({level})',

  NOTIFICATION_ATTENDANCE_ESCALATION_BODY:

    '{memberName} — {eventName}. {notes}',

  NOTIFICATION_EXCUSED_REVIEW_TITLE: 'Amakuru y\'excuse review',

  NOTIFICATION_EXCUSED_APPROVED_BODY:

    'Excuse yawe ya {eventName} yemejwe',

  NOTIFICATION_EXCUSED_REJECTED_BODY:

    'Excuse yawe ya {eventName} yanze',

  NOTIFICATION_DISCIPLINE_TITLE: 'Imyitwarire',

  NOTIFICATION_DISCIPLINE_BODY:

    "Ikibazo cy'imyitwarire cyafunguwe: {caseTitle}",

  NOTIFICATION_DUES_TITLE: 'Imari ya Korali',

  NOTIFICATION_DUES_BODY: 'Asigaye: {amount}',

  INVALID_CREDENTIALS: 'Imeri cyangwa ijambo banga siyo.',

  PASSWORD_RESET_TOKEN_INVALID:
    'Ihuza ryo gusubiramo ijambo banga si ryo cyangwa ryarangiye. Saba indi.',
  INVALID_SESSION: 'Session yawe yarangiye. Ongera winjire.',
  EMAIL_ALREADY_REGISTERED: 'Iyi imeri isanzwe yanditswe.',
  PUBLIC_REGISTRATION_DISABLED:
    'Kwiyandikisha ku rubuga byahagaritswe. Saba umuyobozi link yo gutumira.',
  INVITE_TOKEN_INVALID:
    'Iyi link yo gutumira itemewe cyangwa yarangiye. Vugana n\'umuyobozi.',
  INVITE_ALREADY_PENDING:
    'Ubutumire butegereje burahari kuri iyi imeri.',
  TERMS_NOT_ACCEPTED:
    'Ugomba kwemera amategeko n\'amabwiriza kugira ngo ukomeze.',
  ACCOUNT_INACTIVE: 'Konti yawe ntabwo ikora. Vugana n\'umuyobozi w\'umurimo.',
  MEMBER_PENDING_APPROVAL:
    'Kwiyandikisha kwawe gutegereje kwemezwa n\'umuyobozi.',
  PROFILE_UPDATE_NOT_ALLOWED:
    'Umwirondoro wawe ntushobora guhindurwa muri ubu buryo.',
  INVALID_PHONE_FORMAT:
    'Andika nimero ya telefoni y\'u Rwanda (urug. 0781234567).',
  PHONE_REQUIRED: 'Nimero ya telefoni irakenewe kugira ngo ukomeze.',
  NOTIFICATION_CONTRIBUTION_CONFIRMED_TITLE: 'Imisanzu yemejwe',
  NOTIFICATION_CONTRIBUTION_SUBMITTED_HEAD_TITLE: 'Impano nshya itegereje isuzuma',
  NOTIFICATION_CONTRIBUTION_SUBMITTED_HEAD_BODY:
    '{name} yatanze impano isaba isuzuma n’umuryango wawe.',
  NOTIFICATION_CONTRIBUTION_CONFIRMED_MEMBER_BODY:
    'Impano yemejwe. Amafaranga yemejwe: {amount} {currency}',
  NOTIFICATION_CONTRIBUTION_REJECTED_TITLE: 'Impano yanze',
  NOTIFICATION_CONTRIBUTION_REJECTED_MEMBER_BODY:
    'Impano yanze. Impamvu: {reason}',
  NOTIFICATION_CONTRIBUTION_CONFIRMED_BODY:
    'Imisanzu yawe yemejwe kandi yanditswe.',
  CONTRIBUTION_THANK_YOU_TITLE: 'Murakoze, {memberName}',
  CONTRIBUTION_THANK_YOU_MESSAGE:
    'Murakoze ku misanzu yanyu ya {contributionType} ya {amount} {currency}. Nomero y\'umunyamuryango: {memberNumber}.',
  TOO_MANY_REQUESTS: 'Ugerageje inshuro nyinshi. Tegereza gato hanyuma ugerageze.',
  NOTIFICATION_MEMBER_APPROVED_TITLE: 'Kwiyandikisha kwemewe',
  NOTIFICATION_MEMBER_APPROVED_BODY:
    'Murakaza neza! Kwiyandikisha kwawe mu murimo kwemewe. Ubu ushobora gukoresha sisitemu.',
  NOTIFICATION_MEMBER_REJECTED_TITLE: 'Amakuru y\'iyandikisha',
  NOTIFICATION_MEMBER_REJECTED_BODY:
    'Kwiyandikisha kwawe ntikwemewe. Vugana n\'umuyobozi w\'umurimo ubafashe.',
  WELFARE_NOTIFY_OPENED_TITLE: 'Ubusabane bushya',
  WELFARE_NOTIFY_OPENED_BODY: 'Ubusabane bushya bwasohowe: {title}',
  WELFARE_NOTIFY_APPROVED_TITLE: 'Ubusabane bwemewe',
  WELFARE_NOTIFY_APPROVED_BODY: 'Ubusabane bwemewe: {title}',
  WELFARE_NOTIFY_CLOSED_TITLE: 'Ubusabane bwarangiye',
  WELFARE_NOTIFY_CLOSED_BODY: 'Ubusabane bwarangiye: {title}',
  WELFARE_NOTIFY_FUNDED_TITLE: 'Intego y\'amafaranga yagezweho',
  WELFARE_NOTIFY_FUNDED_BODY: 'Ubusabane bufite amafaranga ahagije: {title}',
  WELFARE_NOTIFY_UPDATED_TITLE: 'Ubusabane bwavuguruwe',
  WELFARE_NOTIFY_UPDATED_BODY: 'Ubusabane bwavuguruwe: {title}',
  REHEARSAL_NOTIFY_SCHEDULED_TITLE: 'Igihe cyo kwitoza cyagenwe',
  REHEARSAL_NOTIFY_SCHEDULED_BODY: '{title} ku wa {date}',
  REHEARSAL_NOTIFY_PLAN_TITLE: 'Gahunda yo kwitoza yavuguruwe',
  REHEARSAL_NOTIFY_PLAN_BODY: 'Urutonde rw\'indirimbo rwavuguruwe kuri {title}',
};

