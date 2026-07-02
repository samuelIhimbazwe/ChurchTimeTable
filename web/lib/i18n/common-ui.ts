import type { AppLocale } from './auth-ui'

export type CommonUiStrings = {
  loading: string
  save: string
  cancel: string
  close: string
  edit: string
  delete: string
  submit: string
  refresh: string
  back: string
  next: string
  previous: string
  yes: string
  no: string
  all: string
  none: string
  required: string
  optional: string
  justNow: string
  minutesAgo: string
  hoursAgo: string
  daysAgo: string
  excellent: string
  good: string
  needsAttention: string
  churchManagementSystem: string
  allRightsReserved: string
}

export const commonUi: Record<AppLocale, CommonUiStrings> = {
  en: {
    loading: 'Loading…',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    submit: 'Submit',
    refresh: 'Refresh',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    yes: 'Yes',
    no: 'No',
    all: 'All',
    none: 'None',
    required: 'Required',
    optional: 'Optional',
    justNow: 'just now',
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
    excellent: 'Excellent',
    good: 'Good',
    needsAttention: 'Needs Attention',
    churchManagementSystem: 'Church Management System',
    allRightsReserved: 'All rights reserved.',
  },
  fr: {
    loading: 'Chargement…',
    save: 'Enregistrer',
    cancel: 'Annuler',
    close: 'Fermer',
    edit: 'Modifier',
    delete: 'Supprimer',
    submit: 'Envoyer',
    refresh: 'Actualiser',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    yes: 'Oui',
    no: 'Non',
    all: 'Tout',
    none: 'Aucun',
    required: 'Obligatoire',
    optional: 'Facultatif',
    justNow: 'à l’instant',
    minutesAgo: ' min',
    hoursAgo: ' h',
    daysAgo: ' j',
    excellent: 'Excellent',
    good: 'Bon',
    needsAttention: 'Attention requise',
    churchManagementSystem: 'Système de gestion d’église',
    allRightsReserved: 'Tous droits réservés.',
  },
}
