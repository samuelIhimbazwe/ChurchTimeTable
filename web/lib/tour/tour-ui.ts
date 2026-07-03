import type { AppLocale } from '@/lib/i18n/auth-ui'
import type { TourPersona } from '@/lib/tour/types'

type TourLocale = AppLocale | 'rw'

export type { TourLocale }

export type TourStepCopy = { title: string; body: string }

export type TourUiStrings = {
  welcomeTitle: string
  welcomeBody: string
  welcomePersonaHint: string
  startTour: string
  remindLater: string
  skipTour: string
  replayTour: string
  replayTourDesc: string
  tourStepOf: string
  next: string
  back: string
  finish: string
  skipStep: string
  endTour: string
  targetMissing: string
  steps: Record<string, Partial<Record<TourPersona | 'default', TourStepCopy>>>
}

const enSteps: TourUiStrings['steps'] = {
  'portal-home': {
    default: {
      title: 'Your member home',
      body:
        'The Member Portal is your personal home — schedule, giving, devotion, and your choir and protocol commitments.',
    },
    choir_leader: {
      title: 'Your starting point',
      body:
        'Start here each day. When you need choir operations, open the choir dashboard from Participation or the sidebar.',
    },
    treasurer: {
      title: 'Your member home',
      body:
        'The portal shows your week at a glance. Finance tools for your office are in the choir dashboard and sidebar.',
    },
    protocol_coordinator: {
      title: 'Your member home',
      body:
        'Stay connected here. Protocol scheduling and team tools live in the Protocol section and sidebar.',
    },
  },
  'quick-actions': {
    default: {
      title: 'Quick actions',
      body:
        'Jump to schedule, giving, devotion, and more — the tasks members use most often.',
    },
    treasurer: {
      title: 'Quick actions',
      body:
        'Members use these shortcuts daily. As treasurer, you will also manage contributions and reports from the choir finance hub.',
    },
  },
  participation: {
    default: {
      title: 'Participation',
      body:
        'See your week at a glance and where you can serve — choir and protocol. Open your dashboards from here.',
    },
    choir_leader: {
      title: 'Participation & your week',
      body:
        'Track rehearsals and conflicts here. Open the choir dashboard to manage scheduling, membership, and office work.',
    },
    protocol_coordinator: {
      title: 'Participation',
      body:
        'View protocol duties alongside choir commitments. Open the protocol dashboard for team coordination.',
    },
  },
  'choir-office': {
    choir_leader: {
      title: 'Choir dashboard',
      body:
        'Once you are in a choir, this button opens your operations workspace — scheduling, music, welfare, and leadership hubs.',
    },
  },
  'finance-focus': {
    treasurer: {
      title: 'Giving & finance',
      body:
        'Members submit contributions from here. You will review, approve, and export choir finances from the treasurer hub in the sidebar.',
    },
  },
  'protocol-focus': {
    protocol_coordinator: {
      title: 'Protocol',
      body:
        'Protocol members coordinate hospitality and service. Accept invitations here or open the protocol dashboard for assignments and treasury.',
    },
  },
  navigation: {
    default: {
      title: 'Navigation',
      body:
        'The sidebar lists every area you can access — portal, choir, protocol, and leadership tools. On mobile, tap the menu icon (top left).',
    },
  },
  search: {
    default: {
      title: 'Find anything fast',
      body:
        'Press Ctrl+K (or ⌘K on Mac) to search members, pages, and actions. It is the fastest way to move around the system.',
    },
  },
  attention: {
    default: {
      title: 'Attention inbox',
      body:
        'Items that need your action — pending approvals, swaps, and alerts — appear here so nothing slips through.',
    },
  },
  notifications: {
    default: {
      title: 'Notifications',
      body:
        'The bell shows announcements, reminders, and updates. Check it after rehearsals or when you see a badge.',
    },
  },
  help: {
    default: {
      title: 'Help anytime',
      body:
        'Open Help for shortcuts and tips. You can replay this guided tour whenever you need a refresher.',
    },
  },
}

export const tourUi: Record<TourLocale, TourUiStrings> = {
  en: {
    welcomeTitle: 'Welcome to CMMS',
    welcomeBody:
      'Take a short interactive tour to learn the member portal, choir system, and protocol system. You can skip, finish later, or replay anytime from Help.',
    welcomePersonaHint: 'Your tour is tailored for:',
    startTour: 'Start tour',
    remindLater: 'Remind me later',
    skipTour: 'Skip for now',
    replayTour: 'Replay product tour',
    replayTourDesc: 'Walk through key features again',
    tourStepOf: 'Step {current} of {total}',
    next: 'Next',
    back: 'Back',
    finish: 'Finish',
    skipStep: 'Skip step',
    endTour: 'End tour',
    targetMissing: 'This section is not visible on this screen — tap Next to continue.',
    steps: enSteps,
  },
  fr: {
    welcomeTitle: 'Bienvenue sur CMMS',
    welcomeBody:
      'Suivez une courte visite interactive pour découvrir l’interface selon votre rôle. Vous pouvez passer, reprendre plus tard ou relancer depuis Aide.',
    welcomePersonaHint: 'Visite adaptée pour :',
    startTour: 'Commencer la visite',
    remindLater: 'Me le rappeler plus tard',
    skipTour: 'Passer pour l’instant',
    replayTour: 'Rejouer la visite guidée',
    replayTourDesc: 'Revoir les fonctions principales',
    tourStepOf: 'Étape {current} sur {total}',
    next: 'Suivant',
    back: 'Retour',
    finish: 'Terminer',
    skipStep: 'Passer cette étape',
    endTour: 'Quitter la visite',
    targetMissing: 'Cette section n’est pas visible ici — appuyez sur Suivant pour continuer.',
    steps: enSteps,
  },
  rw: {
    welcomeTitle: 'Murakaza neza kuri CMMS',
    welcomeBody:
      'Fata urugendo rugufi rwo kumenya aho ibintu biri ukurikije uruhare rwawe. Urashobora gusimbuka, gukomeza nyuma, cyangwa gusubiramo uhereye ku Bufasha.',
    welcomePersonaHint: 'Urugendo rwagenewe:',
    startTour: 'Tangira urugendo',
    remindLater: 'Nyibutsa nyuma',
    skipTour: 'Simbuka ubu',
    replayTour: 'Subiramo urugendo',
    replayTourDesc: 'Subira ku bintu by’ingenzi',
    tourStepOf: 'Intambwe {current} kuri {total}',
    next: 'Ibikurikira',
    back: 'Subira inyuma',
    finish: 'Soza',
    skipStep: 'Simbuka iyi ntambwe',
    endTour: 'Soza urugendo',
    targetMissing: 'Iki gice ntikiboneka hano — kanda Ibikurikira.',
    steps: enSteps,
  },
}

export function getStepCopy(
  strings: TourUiStrings,
  stepId: string,
  persona: TourPersona,
): TourStepCopy {
  const entry = strings.steps[stepId]
  if (!entry) {
    return { title: stepId, body: '' }
  }
  return (
    entry[persona]
    ?? entry.default
    ?? { title: stepId, body: '' }
  )
}
