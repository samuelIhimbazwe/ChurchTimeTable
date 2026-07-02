import { create } from 'zustand';
import type { ResolvedAuth } from '@/lib/choir/capability.types';

type PlatformAuthSlice = {
  protocolAuth?: ResolvedAuth;
  churchAuth?: ResolvedAuth;
  platformAuth?: ResolvedAuth;
};

function authsEqual(a: PlatformAuthSlice, b: PlatformAuthSlice): boolean {
  return (
    a.protocolAuth === b.protocolAuth
    && a.churchAuth === b.churchAuth
    && a.platformAuth === b.platformAuth
  );
}

type PlatformAuthState = PlatformAuthSlice & {
  setPlatformAuths: (auths: PlatformAuthSlice) => void;
  clearPlatformAuths: () => void;
};

export const usePlatformAuthStore = create<PlatformAuthState>((set, get) => ({
  protocolAuth: undefined,
  churchAuth: undefined,
  platformAuth: undefined,
  setPlatformAuths: (auths) =>
    set((s) => (authsEqual(s, auths) ? s : auths)),
  clearPlatformAuths: () => {
    const empty = {
      protocolAuth: undefined,
      churchAuth: undefined,
      platformAuth: undefined,
    } as const
    if (authsEqual(get(), empty)) return
    set(empty)
  },
}));
