import { AsyncLocalStorage } from 'node:async_hooks';
import { MAIN_CHOIR_ID } from '../constants/choir.constants';

export interface ChoirContextStore {
  choirId: string;
  userId?: string;
}

export const choirContextStorage = new AsyncLocalStorage<ChoirContextStore>();

export function getActiveChoirId(): string {
  return choirContextStorage.getStore()?.choirId ?? MAIN_CHOIR_ID;
}

/** Prisma filter: match active choir or legacy rows without choirId. */
export function choirScopeFilter(choirId = getActiveChoirId()) {
  return {
    OR: [{ choirId }, { choirId: null }],
  } as const;
}

export function choirScopeWhere(choirId = getActiveChoirId()) {
  return { choirId };
}
