import type { ResolvedAuth } from '../choir/capability.types';
import { can } from '../choir/capability-can.util';

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
    return auths.protocolAuth
      ? can(auths.protocolAuth, capabilityId)
      : false;
  }
  if (capabilityId.endsWith('@church')) {
    return auths.churchAuth ? can(auths.churchAuth, capabilityId) : false;
  }
  if (capabilityId.endsWith('@platform')) {
    return auths.platformAuth ? can(auths.platformAuth, capabilityId) : false;
  }
  return false;
}

export function buildPlatformCapabilityRouter(
  auths: PlatformAuths,
): (capabilityId: string) => boolean {
  return (capabilityId: string) => routePlatformCapability(capabilityId, auths);
}
