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

  NOTIFICATION_ATTENDANCE_TITLE: 'Présence',

  NOTIFICATION_ATTENDANCE_BODY:

    'Votre présence pour {eventName} a été enregistrée',

  NOTIFICATION_DISCIPLINE_TITLE: 'Discipline',

  NOTIFICATION_DISCIPLINE_BODY:

    'Un dossier disciplinaire a été ouvert : {caseTitle}',

  NOTIFICATION_DUES_TITLE: 'Finances de la chorale',

  NOTIFICATION_DUES_BODY: 'Solde restant : {amount}',

};

