import type { AppLocale } from './auth-ui'

export type ShellUiStrings = {
  helpTitle: string
  quickActions: string
  tips: string
  searchSystem: string
  searchSystemDesc: string
  memberPortalDesc: string
  myProfileDesc: string
  dashboardDesc: string
  tipSearch: string
  tipMobileMenu: string
  tipBell: string
  tipContact: string
  helpFooter: string
  searchPlaceholder: string
  searchMinChars: string
  searching: string
  searchUnavailable: string
  searchNoResults: string
  markAllRead: string
  noNotifications: string
  viewAllNotifications: string
  allCaughtUp: string
}

export const shellUi: Record<AppLocale, ShellUiStrings> = {
  en: {
    helpTitle: 'Help & support',
    quickActions: 'Quick actions',
    tips: 'Tips',
    searchSystem: 'Search the system',
    searchSystemDesc: 'Members, services, choirs, and more',
    memberPortalDesc: 'Your home, schedule, and choirs',
    myProfileDesc: 'Update your details',
    dashboardDesc: 'Leadership overview',
    tipSearch:
      'Press Ctrl+K or ⌘K to search. Press ? for help and keyboard shortcuts.',
    tipMobileMenu: 'On mobile, tap the menu icon (top left) to open navigation.',
    tipBell: 'Check the bell icon for announcements and reminders.',
    tipContact:
      'For account or access issues, contact your church administrator or choir/protocol leader.',
    helpFooter:
      'CMMS Church Management System — use Help to replay the guided tour anytime.',
    searchPlaceholder: 'Search members, services, choirs…',
    searchMinChars: 'Type at least 2 characters to search…',
    searching: 'Searching…',
    searchUnavailable:
      'Search is unavailable right now. Check that you are signed in and the server is running.',
    searchNoResults: 'No results for',
    markAllRead: 'Mark all read',
    noNotifications: 'No notifications yet',
    viewAllNotifications: 'View all notifications',
    allCaughtUp: "You're all caught up",
  },
  fr: {
    helpTitle: 'Aide et assistance',
    quickActions: 'Actions rapides',
    tips: 'Conseils',
    searchSystem: 'Rechercher dans le système',
    searchSystemDesc: 'Membres, cultes, chorales et plus',
    memberPortalDesc: 'Accueil, emploi du temps et chorales',
    myProfileDesc: 'Mettre à jour vos informations',
    dashboardDesc: 'Vue d’ensemble direction',
    tipSearch:
      'Ctrl+K ou ⌘K pour rechercher. ? pour l’aide et les raccourcis clavier.',
    tipMobileMenu:
      'Sur mobile, touchez l’icône menu (en haut à gauche) pour la navigation.',
    tipBell: 'Consultez la cloche pour les annonces et rappels.',
    tipContact:
      'Pour l’accès au compte, contactez l’administrateur ou le responsable chorale/protocol.',
    helpFooter:
      'CMMS — Système de gestion d’église. Relancez la visite guidée depuis Aide.',
    searchPlaceholder: 'Rechercher membres, cultes, chorales…',
    searchMinChars: 'Saisissez au moins 2 caractères…',
    searching: 'Recherche…',
    searchUnavailable:
      'Recherche indisponible. Vérifiez votre connexion et que le serveur fonctionne.',
    searchNoResults: 'Aucun résultat pour',
    markAllRead: 'Tout marquer lu',
    noNotifications: 'Aucune notification',
    viewAllNotifications: 'Voir toutes les notifications',
    allCaughtUp: 'Vous êtes à jour',
  },
  rw: {
    helpTitle: 'Ubufasha',
    quickActions: 'Ibikorwa byihuse',
    tips: 'Inama',
    searchSystem: 'Shakisha muri sisitemu',
    searchSystemDesc: 'Abanyamuryango, serivisi, korali n’ibindi',
    memberPortalDesc: 'Ahabanza, gahunda n’amakorali',
    myProfileDesc: 'Hindura amakuru yawe',
    dashboardDesc: 'Incamake y’ubuyobozi',
    tipSearch: 'Kanda Ctrl+K cyangwa ⌘K ushakire. Kanda ? kubufasha n\'amabwiriza ya keyboard.',
    tipMobileMenu: 'Kuri telefone, kanda akarango ka menu (hejuru ibumoso).',
    tipBell: 'Reba agaciro k’amatangazo n’ibibutsa.',
    tipContact:
      'Ikibazo cy’uburenganzira ? Vugana n’umuyobozi w’itorero cyangwa umuyobozi wa korali/protocol.',
    helpFooter: 'CMMS — Sisitemu y’itorero. Subiramo urugendo uhereye ku Bufasha.',
    searchPlaceholder: 'Shakisha abanyamuryango, serivisi, korali…',
    searchMinChars: 'Andika nibura inyuguti 2…',
    searching: 'Gushakisha…',
    searchUnavailable:
      'Gushakisha ntibishoboka. Reba ko winjiye kandi seriveri ikora.',
    searchNoResults: 'Nta bisubizo bya',
    markAllRead: 'Byose bisomwe',
    noNotifications: 'Nta makuru',
    viewAllNotifications: 'Reba amakuru yose',
    allCaughtUp: 'Warangije',
  },
}
