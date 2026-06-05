"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsInput } from "@/components/ui/cmms-input";
import { getApiErrorMessage, http, trackUxEvent } from "@/core/api/http";
import { Link } from "@/i18n/routing";

export default function ProtocolDiscoveryPage() {
  const t = useTranslations("protocolDiscovery");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitClaim(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await http.post("/protocol/claims", { message: notes || undefined });
      await trackUxEvent("protocol_claim_submitted");
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="cmms-page mx-auto max-w-3xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{t("subtitle")}</p>
        </header>

        <CmmsCard title={t("whatWeDo")}>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--muted-foreground)]">
            <li>{t("bulletWelcome")}</li>
            <li>{t("bulletCoordination")}</li>
            <li>{t("bulletReplacements")}</li>
            <li>{t("bulletReporting")}</li>
          </ul>
        </CmmsCard>

        <CmmsCard title={t("existingMember")}>
          {success ? (
            <p className="text-sm text-[var(--muted-foreground)]">{t("claimSuccess")}</p>
          ) : (
            <form onSubmit={submitClaim} className="space-y-4">
              <CmmsInput
                id="claimNotes"
                label={t("claimNotesLabel")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {error ? (
                <p className="text-sm text-[var(--destructive)]" role="alert">
                  {error}
                </p>
              ) : null}
              <CmmsButton type="submit" disabled={submitting}>
                {submitting ? t("submitting") : t("submitClaim")}
              </CmmsButton>
            </form>
          )}
        </CmmsCard>

        <p className="text-sm text-[var(--muted-foreground)]">
          {t("invitationHint")}{" "}
          <Link href="/my-invitations" className="text-[var(--primary)] hover:underline">
            {t("viewInvitations")}
          </Link>
        </p>

        <Link href="/dashboard/member" className="text-sm text-[var(--primary)] hover:underline">
          {t("backHome")}
        </Link>
      </div>
    </ProtectedRoute>
  );
}
