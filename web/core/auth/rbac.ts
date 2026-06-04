import type { AuthProfile } from "@/core/api/types";
import {
  hasEffectivePermission,
  hasOperationalLeaderDashboard,
  hasPlatformAdminAccess,
  canAccessLeaderDashboard,
} from "@/core/auth/governance-permissions";

export type DashboardExperience = "member" | "leader" | "super-admin";

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

  return permissions.some((permission) =>
    hasEffectivePermission(profile.permissions, permission),
  );
}

export function getDashboardExperience(
  profile: AuthProfile | null,
): DashboardExperience {
  if (!profile) {
    return "member";
  }

  if (hasPlatformAdminAccess(profile.permissions)) {
    return "super-admin";
  }

  if (
    canAccessLeaderDashboard(profile.permissions) ||
    hasOperationalLeaderDashboard(profile.permissions)
  ) {
    return "leader";
  }

  return "member";
}
