'use client';

import { useUiCapability, useCapability, useAnyCapability } from '@/lib/hooks/useCapability';
import {
  usePlatformPermissionCapability,
  usePlatformUiCapability,
} from '@/lib/hooks/usePlatformCapability';

interface CapabilityGateProps {
  /** Choir UI capability id from a choir UI capability registry */
  uiCapability?: string;
  /** Platform UI capability id (protocol/church/system legacy permission bridge) */
  platformUiCapability?: string;
  /** Legacy single permission — resolved via platform registry when mapped */
  platformPermission?: string;
  /** Raw capability id(s) */
  capability?: string;
  anyOf?: string[];
  scopeId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function CapabilityGate({
  uiCapability,
  platformUiCapability,
  platformPermission,
  capability,
  anyOf,
  scopeId,
  fallback = null,
  children,
}: CapabilityGateProps) {
  const uiAllowed = uiCapability ? useUiCapability(uiCapability, scopeId) : false;
  const platformUiAllowed = platformUiCapability
    ? usePlatformUiCapability(platformUiCapability)
    : false;
  const platformPermAllowed = platformPermission
    ? usePlatformPermissionCapability(platformPermission)
    : false;
  const singleAllowed = capability ? useCapability(capability, scopeId) : false;
  const anyAllowed = anyOf?.length ? useAnyCapability(anyOf, scopeId) : false;

  const allowed = uiCapability
    ? uiAllowed
    : platformUiCapability
      ? platformUiAllowed
      : platformPermission
        ? platformPermAllowed
        : capability
          ? singleAllowed
          : anyOf
            ? anyAllowed
            : true;

  return allowed ? <>{children}</> : <>{fallback}</>;
}
