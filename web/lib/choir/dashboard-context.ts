export type ChoirDashboardPosition = {
  roleKey: string
  roleName: string
  permissions: string[]
}

export type ChoirDashboardContext = {
  choir: {
    id: string
    name: string
    code: string
    choirKind: string
  }
  membership: {
    role: string
    isActive: true
  } | null
  positions: ChoirDashboardPosition[]
  permissions: string[]
  landingPath: string
  canAccess: boolean
  familyOffices?: Array<{
    role: string
    familyId: string
    familyName: string
    officePath: string
    label: string
  }>
  customRoles?: Array<{
    id: string
    customRoleId: string
    name: string
    description: string | null
    permissions: string[]
  }>
}
