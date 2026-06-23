import { can } from './capability-can.util';
import type { ResolvedAuth } from './capability.types';

const MEMBER_MANAGE_CAP = 'choir.member.manage@choir';
const MEMBER_VIEW_CAP = 'choir.member.view@choir';

export type ChoirCapabilityAuths = {
  rolesAuth?: ResolvedAuth;
  devotionAuth?: ResolvedAuth;
  logisticsAuth?: ResolvedAuth;
  voiceAuth?: ResolvedAuth;
  commsAuth?: ResolvedAuth;
  rosterAuth?: ResolvedAuth;
  musicAuth?: ResolvedAuth;
  joinAuth?: ResolvedAuth;
  sponsorAuth?: ResolvedAuth;
  opsAuth?: ResolvedAuth;
  disciplineAuth?: ResolvedAuth;
  welfareAuth?: ResolvedAuth;
  contributionAuth?: ResolvedAuth;
};

function canOptional(
  auth: ResolvedAuth | undefined,
  capabilityId: string,
  scopeId?: string,
): boolean {
  if (!auth) return false;
  return can(auth, capabilityId, scopeId);
}

function canMemberManage(
  joinAuth: ResolvedAuth | undefined,
  sponsorAuth: ResolvedAuth | undefined,
  rosterAuth: ResolvedAuth | undefined,
): boolean {
  return (
    canOptional(joinAuth, MEMBER_MANAGE_CAP)
    || canOptional(sponsorAuth, MEMBER_MANAGE_CAP)
    || canOptional(rosterAuth, MEMBER_MANAGE_CAP)
  );
}

function isRolesCapabilityId(id: string): boolean {
  return (
    id.startsWith('choir.custom_role.')
    || id.startsWith('choir.committee_role.')
    || id.startsWith('choir.committee_member.')
  );
}

/** Route a choir capability id across domain auth blobs (HTTP + nav parity). */
export function routeChoirCapability(
  capabilityId: string,
  auths: ChoirCapabilityAuths,
  scopeId?: string,
): boolean {
  if (capabilityId === MEMBER_MANAGE_CAP) {
    return canMemberManage(auths.joinAuth, auths.sponsorAuth, auths.rosterAuth);
  }
  if (capabilityId === MEMBER_VIEW_CAP) {
    return canOptional(auths.rosterAuth, capabilityId, scopeId);
  }
  if (isRolesCapabilityId(capabilityId)) {
    return canOptional(auths.rolesAuth, capabilityId, scopeId);
  }
  if (capabilityId.startsWith('choir.devotion.')) {
    return canOptional(auths.devotionAuth, capabilityId, scopeId);
  }
  if (
    capabilityId.startsWith('choir.document.')
    || capabilityId.startsWith('choir.uniform.')
    || capabilityId.startsWith('choir.equipment.')
  ) {
    return canOptional(auths.logisticsAuth, capabilityId, scopeId);
  }
  if (capabilityId.startsWith('choir.voice.')) {
    return canOptional(auths.voiceAuth, capabilityId, scopeId);
  }
  if (
    capabilityId.startsWith('choir.announcement.')
    || capabilityId.startsWith('choir.meeting.')
  ) {
    return canOptional(auths.commsAuth, capabilityId, scopeId);
  }
  if (
    capabilityId.startsWith('choir.music.')
    || capabilityId.startsWith('choir.rehearsal.')
  ) {
    return canOptional(auths.musicAuth, capabilityId, scopeId);
  }
  if (capabilityId.startsWith('choir.sponsor.')) {
    return canOptional(auths.sponsorAuth, capabilityId, scopeId);
  }
  if (capabilityId.startsWith('choir.join.')) {
    return canOptional(auths.joinAuth, capabilityId, scopeId);
  }
  if (
    capabilityId.startsWith('choir.ops.')
    || capabilityId === 'choir.report.export@choir'
  ) {
    return canOptional(auths.opsAuth, capabilityId, scopeId);
  }
  if (capabilityId.startsWith('choir.discipline.')) {
    return canOptional(auths.disciplineAuth, capabilityId, scopeId);
  }
  if (capabilityId.startsWith('choir.welfare.')) {
    return canOptional(auths.welfareAuth, capabilityId, scopeId);
  }
  return canOptional(auths.contributionAuth, capabilityId, scopeId);
}

export function buildCapabilityRouterFromAuths(
  auths: ChoirCapabilityAuths,
  scopeId?: string,
): (capabilityId: string) => boolean {
  return (capabilityId) => routeChoirCapability(capabilityId, auths, scopeId);
}
