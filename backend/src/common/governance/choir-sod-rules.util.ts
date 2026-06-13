import { PERMISSIONS } from '../constants/roles';

export type ChoirSodSeverity = 'high' | 'medium' | 'low';

export type ChoirSodWarning = {
  id: string;
  severity: ChoirSodSeverity;
  message: string;
  permissions?: string[];
  roleNames?: string[];
};

const FAMILY_APPROVE = PERMISSIONS.CHOIR_CONTRIBUTION_APPROVE_FAMILY;
const TREASURY_VERIFY = PERMISSIONS.CHOIR_FINANCE_APPROVE;
const TREASURY_MANAGE = PERMISSIONS.CHOIR_FINANCE_MANAGE;
const EXEC_ROLE_NAMES = new Set(['president', 'vice_president', 'choir_leader', 'vice_leader']);
const TREASURER_ROLE_NAMES = new Set(['treasurer', 'umubitsi']);

function hasAny(permissions: string[], codes: string[]) {
  return codes.some((code) => permissions.includes(code));
}

export function evaluateChoirPermissionSoD(
  permissions: string[],
  roleName?: string,
): ChoirSodWarning[] {
  const warnings: ChoirSodWarning[] = [];
  const normalizedRole = roleName?.trim().toLowerCase();

  if (permissions.includes(FAMILY_APPROVE) && permissions.includes(TREASURY_VERIFY)) {
    warnings.push({
      id: 'family-approve-treasury-verify',
      severity: 'high',
      message:
        'Family gift approval and treasury verification on one role breaks segregation of duties. Split across family head and treasurer.',
      permissions: [FAMILY_APPROVE, TREASURY_VERIFY],
    });
  }

  if (
    normalizedRole &&
    EXEC_ROLE_NAMES.has(normalizedRole) &&
    permissions.includes(TREASURY_VERIFY)
  ) {
    warnings.push({
      id: 'executive-treasury-verify',
      severity: 'medium',
      message:
        'Executive seats should not treasury-verify contributions. Keep posting with the treasurer role.',
      permissions: [TREASURY_VERIFY],
      roleNames: [normalizedRole],
    });
  }

  if (
    normalizedRole &&
    TREASURER_ROLE_NAMES.has(normalizedRole) &&
    !hasAny(permissions, [TREASURY_VERIFY, TREASURY_MANAGE])
  ) {
    warnings.push({
      id: 'treasurer-missing-finance',
      severity: 'low',
      message:
        'Treasurer role is missing treasury verify/manage permissions — verification desk will be inaccessible.',
      roleNames: [normalizedRole],
    });
  }

  if (
    permissions.includes(TREASURY_MANAGE) &&
    permissions.includes(PERMISSIONS.CHOIR_JOIN_REVIEW) &&
    permissions.includes(TREASURY_VERIFY) &&
    permissions.includes(PERMISSIONS.DISCIPLINE_MANAGE)
  ) {
    warnings.push({
      id: 'over-powered-bundle',
      severity: 'medium',
      message:
        'This permission bundle combines membership, treasury, and discipline control. Consider an advisor-style split.',
      permissions: [
        TREASURY_VERIFY,
        TREASURY_MANAGE,
        PERMISSIONS.CHOIR_JOIN_REVIEW,
        PERMISSIONS.DISCIPLINE_MANAGE,
      ],
    });
  }

  return warnings;
}

export function evaluateChoirMemberAssignmentSoD(
  roleNames: string[],
): ChoirSodWarning[] {
  const warnings: ChoirSodWarning[] = [];
  const normalized = roleNames.map((name) => name.trim().toLowerCase());
  const hasExec = normalized.some((name) => EXEC_ROLE_NAMES.has(name));
  const hasTreasurer = normalized.some((name) => TREASURER_ROLE_NAMES.has(name));

  if (hasExec && hasTreasurer) {
    warnings.push({
      id: 'member-exec-and-treasurer',
      severity: 'high',
      message:
        'Same person holds executive and treasurer committee seats. Prefer separate incumbents for money posting SoD.',
      roleNames: normalized.filter(
        (name) => EXEC_ROLE_NAMES.has(name) || TREASURER_ROLE_NAMES.has(name),
      ),
    });
  }

  return warnings;
}
