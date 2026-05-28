"use client";

import { useSessionStore } from "@/core/auth/session-store";

export function useSessionReady() {
  return useSessionStore((state) => state.status === "ready");
}
