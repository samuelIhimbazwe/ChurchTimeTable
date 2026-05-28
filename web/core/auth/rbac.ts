import type { AuthProfile } from "@/core/api/types";

export type DashboardExperience = "member" | "leader" | "super-admin";

const leaderRoles = new Set([
  "CHOIR_LEADER",
  "CHOIR_PRESIDENT",
  "CHOIR_VICE_PRESIDENT",
  "CHOIR_SECRETARY",
  "CHOIR_TREASURER",
  "CHOIR_REHEARSAL_DIRECTOR",
  "CHOIR_LOGISTICS",
  "CHOIR_COMMITTEE",
  "PROTOCOL_LEADER",
  "CHURCH_ADMIN",
]);

export function hasRole(profile: AuthProfile | null, roles: string[]) {
  if (!profile) {
    return false;
  }

  return roles.some((role) => profile.roles.includes(role));
}

export function hasPermission(profile: AuthProfile | null, permissions: string[]) {
  if (!profile) {
    return false;
  }

  return permissions.some((permission) => profile.permissions.includes(permission));
}

export function getDashboardExperience(
  profile: AuthProfile | null,
): DashboardExperience {
  if (!profile) {
    return "member";
  }

  if (profile.roles.includes("SUPER_ADMIN")) {
    return "super-admin";
  }

  if (
    profile.roles.some((role) => leaderRoles.has(role)) ||
    hasPermission(profile, ["report:export", "event:write", "finance:read"])
  ) {
    return "leader";
  }

  return "member";
}
