import type { ResolvedAuth } from '@/lib/choir/capability.types';
import { can } from '@/lib/choir/capability-can';

export type PlatformAuths = {
  protocolAuth?: ResolvedAuth;
  churchAuth?: ResolvedAuth;
  platformAuth?: ResolvedAuth;
};

export function routePlatformCapability(
  capabilityId: string,
  auths: PlatformAuths,
): boolean {
  if (capabilityId.endsWith('@ministry')) {
    return can(auths.protocolAuth, capabilityId);
  }
  if (capabilityId.endsWith('@church')) {
    return can(auths.churchAuth, capabilityId);
  }
  if (capabilityId.endsWith('@platform')) {
    return can(auths.platformAuth, capabilityId);
  }
  return false;
}

export function buildPlatformCapabilityRouter(
  auths: PlatformAuths,
): (capabilityId: string) => boolean {
  return (capabilityId: string) => routePlatformCapability(capabilityId, auths);
}
