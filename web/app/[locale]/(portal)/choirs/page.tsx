"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { fetchPublicChoirs, getApiErrorMessage, http } from "@/core/api/http";
import { Link } from "@/i18n/routing";

type PublicChoir = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  leader?: string | null;
  membershipCount?: number;
  joinStatus?: string | null;
};

export default function ChoirsDiscoveryPage() {
  const t = useTranslations("choirDiscovery");
  const [choirs, setChoirs] = useState<PublicChoir[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicChoirs()
      .then((rows) => setChoirs(rows as PublicChoir[]))
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  async function requestJoin(choirId: string) {
    setJoining(choirId);
    try {
      await http.post("/choirs/join-requests", { choirId, requestType: "PERMANENT_MEMBER" });
      const rows = await fetchPublicChoirs();
      setChoirs(rows as PublicChoir[]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setJoining(null);
    }
  }

  return (
    <ProtectedRoute>
      <div className="cmms-page mx-auto max-w-4xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{t("subtitle")}</p>
        </header>

        {error ? (
          <p className="text-sm text-[var(--destructive)]" role="alert">
            {error}
          </p>
        ) : null}

        {choirs.length === 0 && !error ? (
          <CmmsEmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            actionLabel={t("emptyAction")}
            onAction={() => window.location.assign("/membership")}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {choirs.map((choir) => (
              <li key={choir.id}>
                <CmmsCard title={choir.name}>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {choir.description ?? t("defaultDescription")}
                  </p>
                  <dl className="mt-3 space-y-1 text-sm">
                    {choir.leader ? (
                      <div>
                        <dt className="inline text-[var(--muted-foreground)]">{t("leader")}: </dt>
                        <dd className="inline">{choir.leader}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="inline text-[var(--muted-foreground)]">{t("members")}: </dt>
                      <dd className="inline">{choir.membershipCount ?? 0}</dd>
                    </div>
                  </dl>
                  {choir.joinStatus === "PENDING" ? (
                    <p className="mt-4 text-sm text-[var(--muted-foreground)]">
                      {t("requestPending")}
                    </p>
                  ) : (
                    <CmmsButton
                      type="button"
                      size="sm"
                      className="mt-4"
                      disabled={!!joining}
                      onClick={() => requestJoin(choir.id)}
                    >
                      {joining === choir.id ? t("submitting") : t("joinChoir")}
                    </CmmsButton>
                  )}
                </CmmsCard>
              </li>
            ))}
          </ul>
        )}

        <Link href="/dashboard/member" className="text-sm text-[var(--primary)] hover:underline">
          {t("backHome")}
        </Link>
      </div>
    </ProtectedRoute>
  );
}
