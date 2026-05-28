"use client";

import { useEffect } from "react";

import { fetchCurrentUser, refreshSession, signOut } from "@/core/api/http";
import { useSessionStore } from "@/core/auth/session-store";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";

function SessionBootstrap({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);
  const setStatus = useSessionStore((state) => state.setStatus);

  useEffect(() => {
    let cancelled = false;

    refreshSession()
      .then((token) => {
        if (cancelled) {
          return null;
        }

        if (!token) {
          if (!useSessionStore.getState().accessToken) {
            clearSession();
          }
          return null;
        }

        return fetchCurrentUser();
      })
      .then((profile) => {
        if (cancelled) {
          return;
        }

        const token = useSessionStore.getState().accessToken;
        if (!profile || !token) {
          return;
        }

        setSession({ accessToken: token, profile });
      })
      .catch(() => {
        if (!cancelled && !useSessionStore.getState().accessToken) {
          signOut();
          clearSession();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStatus("ready");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession, setSession, setStatus]);

  return children;
}

export function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <SessionBootstrap>{children}</SessionBootstrap>
      </QueryProvider>
    </ThemeProvider>
  );
}
