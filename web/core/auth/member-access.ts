import type { AuthProfile } from "@/core/api/types";

export function isPendingMember(profile: AuthProfile | null | undefined): boolean {
  return profile?.member?.status === "PENDING";
}

export function needsOnboardingWelcome(
  profile: AuthProfile | null | undefined,
): boolean {
  if (!profile || isPendingMember(profile)) {
    return false;
  }
  return profile.onboardingCompleted === false;
}

export function getPostAuthPath(profile: AuthProfile | null): string {
  if (!profile) {
    return "/login";
  }
  if (isPendingMember(profile)) {
    return "/pending-approval";
  }
  return "/dashboard";
}
