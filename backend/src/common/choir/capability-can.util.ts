import type { ResolvedAuth, ScopedCapability } from './capability.types';
import { capabilityRequiresScopeId } from './contribution-capability-ids';

export function scopedCapabilityKey(cap: ScopedCapability): string {
  return cap.scopeId ? `${cap.id}#${cap.scopeId}` : cap.id;
}

export function dedupeScopedCapabilities(
  caps: ScopedCapability[],
): ScopedCapability[] {
  const seen = new Set<string>();
  const out: ScopedCapability[] = [];
  for (const cap of caps) {
    const key = scopedCapabilityKey(cap);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cap);
  }
  return out;
}

/**
 * Authorize a contribution action. Single entry point for capability checks.
 */
export function can(
  resolvedAuth: ResolvedAuth,
  capabilityId: string,
  scopeId?: string,
): boolean {
  return resolvedAuth.capabilities.some((cap) => {
    if (cap.id !== capabilityId) return false;
    if (!capabilityRequiresScopeId(capabilityId)) return true;
    if (!scopeId) return false;
    return cap.scopeId === scopeId;
  });
}

export function hasAnyCapability(
  resolvedAuth: ResolvedAuth,
  capabilityIds: string[],
  scopeId?: string,
): boolean {
  return capabilityIds.some((id) => can(resolvedAuth, id, scopeId));
}
