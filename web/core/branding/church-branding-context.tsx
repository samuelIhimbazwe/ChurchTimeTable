"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchChurchBranding } from "@/core/api/http";

export type ChurchBranding = {
  churchName: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  primaryColor: string | null;
  welcomeMessage: string | null;
};

type ChurchBrandingContextValue = {
  branding: ChurchBranding | null;
  loading: boolean;
  error: boolean;
};

const ChurchBrandingContext = createContext<ChurchBrandingContextValue>({
  branding: null,
  loading: true,
  error: false,
});

function applyPrimaryColor(color: string | null | undefined) {
  if (!color || typeof document === "undefined") return;
  document.documentElement.style.setProperty("--primary", color);
}

export function ChurchBrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<ChurchBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchChurchBranding()
      .then((payload) => {
        if (cancelled) return;
        const next = payload as ChurchBranding;
        setBranding(next);
        applyPrimaryColor(next.primaryColor);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ branding, loading, error }),
    [branding, loading, error],
  );

  return (
    <ChurchBrandingContext.Provider value={value}>
      {children}
    </ChurchBrandingContext.Provider>
  );
}

export function useChurchBranding() {
  return useContext(ChurchBrandingContext);
}
