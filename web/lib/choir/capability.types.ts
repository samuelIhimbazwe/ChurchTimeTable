export type Scope = 'self' | 'family' | 'choir' | 'sponsor';

export interface ScopedCapability {
  id: string;
  scopeId?: string;
}

export interface ResolvedAuth {
  userId: string;
  choirId: string;
  capabilities: ScopedCapability[];
}
