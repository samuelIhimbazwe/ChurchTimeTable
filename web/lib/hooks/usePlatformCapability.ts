'use client';

import { useEffectivePermissions } from '@/lib/hooks/useEffectivePermissions';
import {
  platformUiCapabilityVisible,
  PLATFORM_PERMISSION_TO_UI,
} from '@/lib/platform/platform-ui-capability-registry';

export function usePlatformUiCapability(uiId: string): boolean {
  const effective = useEffectivePermissions();
  return platformUiCapabilityVisible(uiId, effective);
}

/** Resolve a legacy permission string to a platform UI capability check. */
export function usePlatformPermissionCapability(permission: string): boolean {
  const uiId = PLATFORM_PERMISSION_TO_UI[permission];
  const effective = useEffectivePermissions();
  if (uiId) return platformUiCapabilityVisible(uiId, effective);
  return effective.includes(permission);
}
