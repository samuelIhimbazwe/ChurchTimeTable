"use client";

import { create } from "zustand";

import type { AuthProfile } from "@/core/api/types";

type SessionStatus = "booting" | "ready";
type SessionEndReason = "expired" | "manual" | null;

interface SessionState {
  accessToken: string | null;
  profile: AuthProfile | null;
  status: SessionStatus;
  sessionEndReason: SessionEndReason;
  setStatus: (status: SessionStatus) => void;
  setAccessToken: (accessToken: string | null) => void;
  setProfile: (profile: AuthProfile | null) => void;
  setSession: (input: { accessToken: string; profile: AuthProfile | null }) => void;
  clearSession: (reason?: SessionEndReason) => void;
  consumeSessionEndReason: () => SessionEndReason;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  accessToken: null,
  profile: null,
  status: "booting",
  sessionEndReason: null,
  setStatus: (status) => set({ status }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setProfile: (profile) => set({ profile }),
  setSession: ({ accessToken, profile }) =>
    set({
      accessToken,
      profile,
      status: "ready",
      sessionEndReason: null,
    }),
  clearSession: (reason = "manual") =>
    set({
      accessToken: null,
      profile: null,
      status: "ready",
      sessionEndReason: reason,
    }),
  consumeSessionEndReason: () => {
    const reason = get().sessionEndReason;
    set({ sessionEndReason: null });
    return reason;
  },
}));
