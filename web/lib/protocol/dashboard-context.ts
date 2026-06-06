export type ProtocolDashboardPosition = {
  roleKey: string
  roleName: string
  permissions: string[]
}

export type ProtocolDashboardContext = {
  ministry: {
    id: string
    name: string
  }
  membership: {
    isActive: true
  } | null
  positions: ProtocolDashboardPosition[]
  permissions: string[]
  landingPath: string
  canAccess: boolean
}
