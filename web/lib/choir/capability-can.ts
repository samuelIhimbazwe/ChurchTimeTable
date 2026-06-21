import type { ResolvedAuth, ScopedCapability } from './capability.types';

export type { ResolvedAuth, ScopedCapability };

export function capabilityRequiresScopeId(id: string): boolean {
  return id.endsWith('@family') || id.endsWith('@sponsor');
}

export function can(
  resolvedAuth: ResolvedAuth | undefined,
  capabilityId: string,
  scopeId?: string,
): boolean {
  if (!resolvedAuth?.capabilities?.length) return false;
  return resolvedAuth.capabilities.some((cap) => {
    if (cap.id !== capabilityId) return false;
    if (!capabilityRequiresScopeId(capabilityId)) return true;
    if (!scopeId) return false;
    return cap.scopeId === scopeId;
  });
}

export function hasAnyCapability(
  resolvedAuth: ResolvedAuth | undefined,
  capabilityIds: string[],
  scopeId?: string,
): boolean {
  return capabilityIds.some((id) => can(resolvedAuth, id, scopeId));
}
