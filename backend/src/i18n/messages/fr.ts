export const frMessages: Record<string, string> = {

  INTERNAL_ERROR: "Une erreur inattendue s'est produite. Veuillez réessayer.",

  BAD_REQUEST: 'Requête invalide.',

  UNAUTHORIZED: 'Identifiants invalides.',

  FORBIDDEN: "Vous n'avez pas l'autorisation pour cette action.",

  NOT_FOUND: 'Ressource introuvable.',

  VALIDATION_ERROR: 'Échec de la validation.',

  CONFLICT: "Conflit d'horaire détecté.",

  BUSINESS_RULE_VIOLATION:

    "Cette action n'est pas conforme aux règles de l'église.",

  SCHEDULE_OVERLAP: 'Le membre a déjà une affectation en conflit.',

  DOUBLE_BOOKING: 'Le membre est déjà affecté à cet événement.',

  PROTOCOL_QUOTA_FULL: 'Ce service protocole a déjà 12 membres.',

  PROTOCOL_MONTHLY_LIMIT:

    'Le membre a atteint la limite mensuelle de services protocole.',

  MINISTRY_CONFLICT: 'Le ministère du membre ne correspond pas à cet événement.',

  CHILDREN_CHOIR_SERVICE1:

    'Seule la chorale des enfants peut être affectée au Service 1.',

  ATTENDANCE_LOCKED: 'La présence est verrouillée après 48 heures.',

  SWAP_NOT_ALLOWED: "L'échange n'est pas autorisé pour cet événement.",

  NOTIFICATION_EVENT_ASSIGNMENT_TITLE: 'Nouvelle affectation',

  NOTIFICATION_EVENT_ASSIGNMENT_BODY:

    'Vous êtes affecté à : {eventName}',

  NOTIFICATION_SWAP_TITLE: 'Échange de service',

  NOTIFICATION_SWAP_REQUESTED_BODY:

    '{memberName} a demandé un échange de service avec vous',

  NOTIFICATION_SWAP_ACCEPTED_BODY:

    '{memberName} a accepté votre demande d\'échange',

  NOTIFICATION_SWAP_REJECTED_BODY:

    '{memberName} a refusé votre demande d\'échange',

  NOTIFICATION_SWAP_APPROVED_BODY:

    'Le responsable a approuvé l\'échange avec {memberName}',

  NOTIFICATION_SWAP_FINALIZED_BODY:

    'Échange finalisé pour {eventName}',

  NOTIFICATION_SWAP_PENDING_LEADER_TITLE: 'Échange en attente de revue',

  NOTIFICATION_SWAP_PENDING_LEADER_BODY:

    'Un échange nécessite la revue du chef d\'équipe pour {eventName}',

  NOTIFICATION_REPLACEMENT_TITLE: 'Mise à jour remplacement',

  NOTIFICATION_REPLACEMENT_REQUESTED_BODY:

    'Demande de remplacement soumise pour {eventName}',

  NOTIFICATION_REPLACEMENT_COVER_ASSIGNED_BODY:

    '{memberName} s\'est porté volontaire pour {eventName}',

  NOTIFICATION_REPLACEMENT_APPROVED_BODY:

    'Remplacement approuvé pour {eventName}',

  NOTIFICATION_REPLACEMENT_REJECTED_BODY:

    'Demande de remplacement refusée pour {eventName}',

  NOTIFICATION_REPLACEMENT_FINALIZED_BODY:

    'Remplacement finalisé pour {eventName}',

  NOTIFICATION_REPLACEMENT_PENDING_LEADER_TITLE: 'Remplacement en attente',

  NOTIFICATION_REPLACEMENT_PENDING_LEADER_BODY:

    'Un remplacement nécessite une revue pour {eventName}',

  NOTIFICATION_COVERAGE_ESCALATION_TITLE: 'Escalade couverture ({level})',

  NOTIFICATION_COVERAGE_ESCALATION_BODY:

    '{memberName} — {eventName}. {notes}',

  NOTIFICATION_READINESS_WARNING_TITLE: 'Alerte préparation culte',

  NOTIFICATION_READINESS_WARNING_BODY:

    '{eventName} préparation: {status}',

  NOTIFICATION_ATTENDANCE_TITLE: 'Présence',

  NOTIFICATION_ATTENDANCE_BODY:

    'Votre présence pour {eventName} a été enregistrée',

  NOTIFICATION_ATTENDANCE_ABSENCE_TITLE: 'Suivi de présence requis',

  NOTIFICATION_ATTENDANCE_ABSENCE_BODY:

    'Une absence a été enregistrée pour {eventName}',

  NOTIFICATION_ATTENDANCE_ESCALATION_TITLE: 'Escalade de présence ({level})',

  NOTIFICATION_ATTENDANCE_ESCALATION_BODY:

    '{memberName} — {eventName}. {notes}',

  NOTIFICATION_EXCUSED_REVIEW_TITLE: 'Mise à jour excuse',

  NOTIFICATION_EXCUSED_APPROVED_BODY:

    'Votre absence excusée pour {eventName} a été approuvée',

  NOTIFICATION_EXCUSED_REJECTED_BODY:

    'Votre absence excusée pour {eventName} n\'a pas été approuvée',

  NOTIFICATION_DISCIPLINE_TITLE: 'Discipline',

  NOTIFICATION_DISCIPLINE_BODY:

    'Un dossier disciplinaire a été ouvert : {caseTitle}',

  NOTIFICATION_DUES_TITLE: 'Finances de la chorale',

  NOTIFICATION_DUES_BODY: 'Solde restant : {amount}',

  INVALID_CREDENTIALS: 'E-mail ou mot de passe incorrect.',

  PASSWORD_RESET_TOKEN_INVALID:
    'Ce lien de réinitialisation est invalide ou expiré. Demandez-en un nouveau.',
  INVALID_SESSION: 'Votre session a expiré. Veuillez vous reconnecter.',
  EMAIL_ALREADY_REGISTERED: 'Cet e-mail est déjà enregistré.',
  PUBLIC_REGISTRATION_DISABLED:
    'L\'inscription publique est désactivée. Demandez un lien d\'invitation à un administrateur.',
  INVITE_TOKEN_INVALID:
    'Ce lien d\'invitation est invalide ou expiré. Contactez votre administrateur.',
  INVITE_ALREADY_PENDING:
    'Une invitation en attente existe déjà pour cet e-mail.',
  TERMS_NOT_ACCEPTED:
    'Vous devez accepter les conditions d\'utilisation pour continuer.',
  ACCOUNT_INACTIVE:
    'Ce compte est inactif. Contactez votre responsable de ministère.',
  MEMBER_PENDING_APPROVAL:
    'Votre inscription attend l\'approbation d\'un responsable.',
  PROFILE_UPDATE_NOT_ALLOWED:
    'Votre profil ne peut pas être modifié dans votre statut actuel.',
  INVALID_PHONE_FORMAT:
    'Entrez un numéro rwandais valide (ex. 0781234567).',
  PHONE_REQUIRED:
    'Un numéro de téléphone est requis pour continuer.',
  NOTIFICATION_CONTRIBUTION_CONFIRMED_TITLE: 'Contribution confirmée',
  NOTIFICATION_CONTRIBUTION_CONFIRMED_BODY:
    'Votre contribution a été confirmée et enregistrée.',
  NOTIFICATION_CONTRIBUTION_CONFIRMED_MEMBER_BODY:
    'Contribution confirmée. Montant confirmé : {amount} {currency}',
  NOTIFICATION_CONTRIBUTION_REJECTED_TITLE: 'Contribution refusée',
  NOTIFICATION_CONTRIBUTION_REJECTED_MEMBER_BODY:
    'Contribution refusée. Motif : {reason}',
  NOTIFICATION_CONTRIBUTION_SUBMITTED_HEAD_TITLE:
    'Nouvelle contribution à examiner',
  NOTIFICATION_CONTRIBUTION_SUBMITTED_HEAD_BODY:
    '{name} a soumis une contribution pour examen par votre famille.',
  CONTRIBUTION_THANK_YOU_TITLE: 'Merci, {memberName}',
  CONTRIBUTION_THANK_YOU_MESSAGE:
    'Merci pour votre contribution {contributionType} de {amount} {currency}. Numéro de membre : {memberNumber}.',
  TOO_MANY_REQUESTS:
    'Trop de tentatives. Patientez un instant puis réessayez.',
  NOTIFICATION_MEMBER_APPROVED_TITLE: 'Inscription approuvée',
  NOTIFICATION_MEMBER_APPROVED_BODY:
    'Bienvenue ! Votre inscription au ministère a été approuvée. Vous avez maintenant accès à la plateforme.',
  NOTIFICATION_MEMBER_REJECTED_TITLE: 'Mise à jour d\'inscription',
  NOTIFICATION_MEMBER_REJECTED_BODY:
    'Votre inscription n\'a pas été approuvée. Contactez votre responsable de ministère.',
  WELFARE_NOTIFY_OPENED_TITLE: 'Dossier de bien-être ouvert',
  WELFARE_NOTIFY_OPENED_BODY: 'Un nouveau dossier a été ouvert : {title}',
  WELFARE_NOTIFY_APPROVED_TITLE: 'Dossier approuvé',
  WELFARE_NOTIFY_APPROVED_BODY: 'Dossier approuvé : {title}',
  WELFARE_NOTIFY_CLOSED_TITLE: 'Dossier clôturé',
  WELFARE_NOTIFY_CLOSED_BODY: 'Dossier clôturé : {title}',
  WELFARE_NOTIFY_FUNDED_TITLE: 'Objectif de financement atteint',
  WELFARE_NOTIFY_FUNDED_BODY: 'Dossier financé : {title}',
  WELFARE_NOTIFY_UPDATED_TITLE: 'Dossier mis à jour',
  WELFARE_NOTIFY_UPDATED_BODY: 'Dossier mis à jour : {title}',
  REHEARSAL_NOTIFY_SCHEDULED_TITLE: 'Répétition planifiée',
  REHEARSAL_NOTIFY_SCHEDULED_BODY: '{title} le {date}',
  REHEARSAL_NOTIFY_PLAN_TITLE: 'Plan de répétition mis à jour',
  REHEARSAL_NOTIFY_PLAN_BODY: 'Liste des chants mise à jour pour {title}',
};

