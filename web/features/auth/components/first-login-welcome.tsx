"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsModal } from "@/components/ui/cmms-modal";
import { completeOnboardingRequest } from "@/core/api/http";
import type { AuthProfile } from "@/core/api/types";
import { needsOnboardingWelcome } from "@/core/auth/member-access";
import { useSessionStore } from "@/core/auth/session-store";

function resolveWelcomeKey(profile: AuthProfile): string {
  const ministry = profile.member?.ministry;
  const roles = profile.roles;

  if (roles.includes("SUPER_ADMIN")) return "welcomeSuperAdmin";
  if (roles.some((role) => role.includes("PRESIDENT") || role.includes("LEADER"))) {
    return ministry === "PROTOCOL" ? "welcomeProtocolLeader" : "welcomeChoirLeader";
  }
  if (roles.some((role) => role.includes("COMMITTEE"))) return "welcomeCommittee";
  if (ministry === "PROTOCOL") return "welcomeProtocolMember";
  if (ministry === "BOTH") return "welcomeBothMember";
  return "welcomeChoirMember";
}

export function FirstLoginWelcome() {
  const t = useTranslations("onboarding.welcome");
  const profile = useSessionStore((state) => state.profile);
  const setProfile = useSessionStore((state) => state.setProfile);
  const [open, setOpen] = useState(() => needsOnboardingWelcome(profile));
  const [submitting, setSubmitting] = useState(false);

  if (!profile || !open) {
    return null;
  }

  const messageKey = resolveWelcomeKey(profile);

  async function handleContinue() {
    setSubmitting(true);
    try {
      await completeOnboardingRequest();
      setProfile({
        ...profile!,
        onboardingCompleted: true,
        member: profile?.member
          ? { ...profile.member, onboardingCompleted: true }
          : profile?.member,
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CmmsModal
      open={open}
      onClose={() => setOpen(false)}
      title={t("title")}
      closeLabel={t("continue")}
    >
      <div className="space-y-4">
        <p className="text-base leading-7 text-[var(--muted-foreground)]">{t(messageKey)}</p>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">{t("nextSteps")}</p>
        <CmmsButton type="button" onClick={handleContinue} disabled={submitting} fullWidth>
          {submitting ? t("continuing") : t("continue")}
        </CmmsButton>
      </div>
    </CmmsModal>
  );
}
