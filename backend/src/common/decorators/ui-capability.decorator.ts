import { SetMetadata } from '@nestjs/common';

export const UI_CAPABILITY_KEY = 'uiCapability';

/** Gate HTTP handlers with a UI capability id (capability-first, legacy permission fallback). */
export const RequireUiCapability = (uiCapabilityId: string) =>
  SetMetadata(UI_CAPABILITY_KEY, uiCapabilityId);
