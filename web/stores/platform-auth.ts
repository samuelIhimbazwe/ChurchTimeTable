import { create } from 'zustand';
import type { ResolvedAuth } from '@/lib/choir/capability.types';

type PlatformAuthState = {
  protocolAuth?: ResolvedAuth;
  churchAuth?: ResolvedAuth;
  platformAuth?: ResolvedAuth;
  setPlatformAuths: (auths: {
    protocolAuth?: ResolvedAuth;
    churchAuth?: ResolvedAuth;
    platformAuth?: ResolvedAuth;
  }) => void;
  clearPlatformAuths: () => void;
};

export const usePlatformAuthStore = create<PlatformAuthState>((set) => ({
  protocolAuth: undefined,
  churchAuth: undefined,
  platformAuth: undefined,
  setPlatformAuths: (auths) => set(auths),
  clearPlatformAuths: () =>
    set({
      protocolAuth: undefined,
      churchAuth: undefined,
      platformAuth: undefined,
    }),
}));
