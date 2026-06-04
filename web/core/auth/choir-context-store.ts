"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Matches backend MAIN_CHOIR_ID */
export const MAIN_CHOIR_ID = "00000000-0000-0000-0000-000000000001";

export interface ChoirOption {
  id: string;
  name: string;
  code: string;
  role?: string;
}

interface ChoirContextState {
  activeChoirId: string;
  choirs: ChoirOption[];
  setActiveChoirId: (id: string) => void;
  setChoirs: (choirs: ChoirOption[]) => void;
}

export const useChoirContextStore = create<ChoirContextState>()(
  persist(
    (set) => ({
      activeChoirId: MAIN_CHOIR_ID,
      choirs: [],
      setActiveChoirId: (activeChoirId) => set({ activeChoirId }),
      setChoirs: (choirs) => set({ choirs }),
    }),
    { name: "cmms-active-choir" },
  ),
);
