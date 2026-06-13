export type FamilyWorkspaceTemplate =
  | 'DEFAULT'
  | 'DECISIONS_FIRST'
  | 'TEAM_HEALTH'

export type HeadWidgetKey = 'decisions' | 'goal' | 'health'
export type SecretaryWidgetKey = 'followUp' | 'pending' | 'reports'

export const FAMILY_WORKSPACE_TEMPLATES: Record<
  FamilyWorkspaceTemplate,
  {
    label: string
    description: string
    headWidgetOrder: HeadWidgetKey[]
    secretaryWidgetOrder: SecretaryWidgetKey[]
    autoRedirectToDecisions: boolean
  }
> = {
  DEFAULT: {
    label: 'Balanced command',
    description: 'Decisions, family goal, and team health in equal focus.',
    headWidgetOrder: ['decisions', 'goal', 'health'],
    secretaryWidgetOrder: ['followUp', 'pending', 'reports'],
    autoRedirectToDecisions: true,
  },
  DECISIONS_FIRST: {
    label: 'Decisions first',
    description: 'Prioritize the approval inbox during active giving seasons.',
    headWidgetOrder: ['decisions', 'goal', 'health'],
    secretaryWidgetOrder: ['pending', 'followUp', 'reports'],
    autoRedirectToDecisions: true,
  },
  TEAM_HEALTH: {
    label: 'Team health focus',
    description: 'Lead with member follow-up; decisions stay one tap away.',
    headWidgetOrder: ['health', 'decisions', 'goal'],
    secretaryWidgetOrder: ['followUp', 'reports', 'pending'],
    autoRedirectToDecisions: false,
  },
}

export function resolveWorkspaceTemplate(
  value?: string | null,
): FamilyWorkspaceTemplate {
  if (value && value in FAMILY_WORKSPACE_TEMPLATES) {
    return value as FamilyWorkspaceTemplate
  }
  return 'DEFAULT'
}
