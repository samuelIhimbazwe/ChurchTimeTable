export type Scope = 'self' | 'family' | 'choir' | 'sponsor';

export interface Capability {
  id: string;
  domain: string;
  resource: string;
  action: string;
  scope: Scope;
}

export interface ScopeBinding {
  scope: Scope;
  scopeId?: string;
}

export type GrantType =
  | 'role_bundle'
  | 'office'
  | 'explicit_permission'
  | 'committee_seat'
  | 'acting_seat';

export interface Grant {
  type: GrantType;
  capabilityIds: string[];
  scopeBinding?: ScopeBinding;
  expiresAt?: string;
  sourceRef?: { type: string; id: string };
}

export interface ScopedCapability {
  id: string;
  scopeId?: string;
}

export interface ResolvedAuth {
  userId: string;
  choirId: string;
  capabilities: ScopedCapability[];
}
