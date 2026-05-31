import type { AuthProfile } from "@/core/api/types";

export type PhoneEnforcementMode = "soft" | "warning" | "strict";

const PHONE_EXEMPT_ROLES = new Set(["SUPER_ADMIN", "CHURCH_ADMIN"]);

const ENFORCEMENT_STATUSES = new Set(["ACTIVE", "PENDING"]);

const STRICT_ALLOWED_ROUTES = new Set([
  "/dashboard",
  "/dashboard/settings/profile",
  "/dashboard/finance/my-contributions",
  "/dashboard/notifications",
]);

function normalizeRoute(route: string): string {
  const withoutQuery = route.split("?")[0] ?? route;
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery || "/dashboard";
}

export function isPhoneEnforcementExempt(profile: AuthProfile | null): boolean {
  if (!profile) {
    return true;
  }
  return profile.roles.some((role) => PHONE_EXEMPT_ROLES.has(role));
}

export function memberMissingPhone(profile: AuthProfile | null): boolean {
  if (!profile?.member || isPhoneEnforcementExempt(profile)) {
    return false;
  }

  const status = profile.member.status;
  if (!status || !ENFORCEMENT_STATUSES.has(status)) {
    return false;
  }

  return !profile.member.phone;
}

export function getPhoneEnforcementMode(
  profile: AuthProfile | null,
): PhoneEnforcementMode {
  if (!profile?.phoneEnforcement?.enabled) {
    return "soft";
  }
  return profile.phoneEnforcement.mode ?? "soft";
}

export function isStrictPhoneBlocked(profile: AuthProfile | null): boolean {
  if (!profile?.phoneEnforcement?.enabled) {
    return false;
  }
  if (profile.phoneEnforcement.mode !== "strict") {
    return false;
  }
  return memberMissingPhone(profile);
}

export function requiresPhone(profile: AuthProfile | null): boolean {
  return memberMissingPhone(profile);
}

export function canAccessRoute(
  profile: AuthProfile | null,
  route: string,
): boolean {
  if (!isStrictPhoneBlocked(profile)) {
    return true;
  }

  const normalized = normalizeRoute(route);
  if (normalized === "/dashboard") {
    return true;
  }

  for (const allowed of STRICT_ALLOWED_ROUTES) {
    if (allowed === "/dashboard") {
      continue;
    }
    if (normalized === allowed || normalized.startsWith(`${allowed}/`)) {
      return true;
    }
  }

  return false;
}

export function phoneEnforcementRedirectRoute(): string {
  return "/dashboard/settings/profile";
}

export function shouldHideOperationalNavigation(
  profile: AuthProfile | null,
): boolean {
  return isStrictPhoneBlocked(profile);
}

export function isWarningPhoneMode(profile: AuthProfile | null): boolean {
  return (
    getPhoneEnforcementMode(profile) === "warning" && memberMissingPhone(profile)
  );
}

export function isSoftPhoneMode(profile: AuthProfile | null): boolean {
  return (
    getPhoneEnforcementMode(profile) === "soft" && memberMissingPhone(profile)
  );
}
