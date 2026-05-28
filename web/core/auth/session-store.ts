"use client";

import { create } from "zustand";

import type { AuthProfile } from "@/core/api/types";

type SessionStatus = "booting" | "ready";

interface SessionState {
  accessToken: string | null;
  profile: AuthProfile | null;
  status: SessionStatus;
  setStatus: (status: SessionStatus) => void;
  setAccessToken: (accessToken: string | null) => void;
  setProfile: (profile: AuthProfile | null) => void;
  setSession: (input: { accessToken: string; profile: AuthProfile | null }) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  profile: null,
  status: "booting",
  setStatus: (status) => set({ status }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setProfile: (profile) => set({ profile }),
  setSession: ({ accessToken, profile }) =>
    set({
      accessToken,
      profile,
      status: "ready",
    }),
  clearSession: () =>
    set({
      accessToken: null,
      profile: null,
      status: "ready",
    }),
}));
