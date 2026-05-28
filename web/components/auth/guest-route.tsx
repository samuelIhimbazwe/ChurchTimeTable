"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { useRouter } from "@/i18n/routing";
import { useSessionStore } from "@/core/auth/session-store";

export function GuestRoute({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = useTranslations("common");
  const router = useRouter();
  const accessToken = useSessionStore((state) => state.accessToken);
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    if (status === "ready" && accessToken) {
      router.replace("/dashboard");
    }
  }, [accessToken, router, status]);

  if (status !== "ready") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        {t("loading")}
      </div>
    );
  }

  if (accessToken) {
    return null;
  }

  return children;
}
