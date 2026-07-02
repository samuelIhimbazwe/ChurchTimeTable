'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEffectivePermissions } from '@/lib/hooks/useEffectivePermissions';
import { usePlatformAuthStore } from '@/stores/platform-auth';
import {
  platformUiCapabilityVisible,
  PLATFORM_PERMISSION_TO_UI,
} from '@/lib/platform/platform-ui-capability-registry';
import { buildPlatformCapabilityRouter } from '@/lib/platform/platform-capability-router';
import { mapPermissionToPlatformCapabilities } from '@/lib/platform/platform-capability.util';

export function usePlatformAuths() {
  return usePlatformAuthStore(
    useShallow((s) => ({
      protocolAuth: s.protocolAuth,
      churchAuth: s.churchAuth,
      platformAuth: s.platformAuth,
    })),
  );
}

export function usePlatformCapabilityRouter(): (capabilityId: string) => boolean {
  const auths = usePlatformAuths();
  return useMemo(() => buildPlatformCapabilityRouter(auths), [auths]);
}

export function usePlatformUiCapability(uiId: string): boolean {
  const router = usePlatformCapabilityRouter();
  const effective = useEffectivePermissions();

  const check = (capId: string) => {
    if (router(capId)) return true;
    return effective.some((perm) =>
      mapPermissionToPlatformCapabilities(perm).some((m) => m.id === capId),
    );
  };

  return platformUiCapabilityVisible(uiId, check);
}

export function usePlatformPermissionCapability(permission: string): boolean {
  const uiId = PLATFORM_PERMISSION_TO_UI[permission];
  const router = usePlatformCapabilityRouter();
  const effective = useEffectivePermissions();

  if (uiId) {
    const check = (capId: string) => {
      if (router(capId)) return true;
      return effective.some((perm) =>
        mapPermissionToPlatformCapabilities(perm).some((m) => m.id === capId),
      );
    };
    return platformUiCapabilityVisible(uiId, check);
  }

  return effective.includes(permission);
}
