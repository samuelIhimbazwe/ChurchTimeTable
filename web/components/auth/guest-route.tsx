"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { useRouter } from "@/i18n/routing";
import { getPostAuthPath, isPendingMember } from "@/core/auth/member-access";
import { useSessionStore } from "@/core/auth/session-store";

export function GuestRoute({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = useTranslations("common");
  const router = useRouter();
  const accessToken = useSessionStore((state) => state.accessToken);
  const profile = useSessionStore((state) => state.profile);
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    if (status === "ready" && accessToken && profile) {
      router.replace(getPostAuthPath(profile));
    }
  }, [accessToken, profile, router, status]);

  if (status !== "ready") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--muted-foreground)]">
        {t("loading")}
      </div>
    );
  }

  if (accessToken && profile) {
    return null;
  }

  return children;
}
