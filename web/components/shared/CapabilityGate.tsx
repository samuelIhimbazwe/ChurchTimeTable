'use client';

import { useUiCapability, useCapability, useAnyCapability } from '@/lib/hooks/useCapability';

interface CapabilityGateProps {
  /** UI capability id from CONTRIBUTION_UI_CAPABILITY_REGISTRY */
  uiCapability?: string;
  /** Raw capability id(s) */
  capability?: string;
  anyOf?: string[];
  scopeId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function CapabilityGate({
  uiCapability,
  capability,
  anyOf,
  scopeId,
  fallback = null,
  children,
}: CapabilityGateProps) {
  const uiAllowed = uiCapability ? useUiCapability(uiCapability, scopeId) : false;
  const singleAllowed = capability ? useCapability(capability, scopeId) : false;
  const anyAllowed = anyOf?.length ? useAnyCapability(anyOf, scopeId) : false;

  const allowed = uiCapability
    ? uiAllowed
    : capability
      ? singleAllowed
      : anyOf
        ? anyAllowed
        : true;

  return allowed ? <>{children}</> : <>{fallback}</>;
}
