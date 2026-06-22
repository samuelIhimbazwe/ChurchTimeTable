import { can } from './capability-can';
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

function canMemberManage(
  joinAuth: ResolvedAuth | undefined,
  sponsorAuth: ResolvedAuth | undefined,
  rosterAuth: ResolvedAuth | undefined,
): boolean {
  return (
    can(joinAuth, MEMBER_MANAGE_CAP)
    || can(sponsorAuth, MEMBER_MANAGE_CAP)
    || can(rosterAuth, MEMBER_MANAGE_CAP)
  );
}

function isRolesCapabilityId(id: string): boolean {
  return (
    id.startsWith('choir.custom_role.')
    || id.startsWith('choir.committee_role.')
    || id.startsWith('choir.committee_member.')
  );
}

/** Route a choir capability id across domain auth blobs (non-hook, for nav + labels). */
export function routeChoirCapability(
  capabilityId: string,
  auths: ChoirCapabilityAuths,
  scopeId?: string,
): boolean {
  if (capabilityId === MEMBER_MANAGE_CAP) {
    return canMemberManage(auths.joinAuth, auths.sponsorAuth, auths.rosterAuth);
  }
  if (capabilityId === MEMBER_VIEW_CAP) {
    return can(auths.rosterAuth, capabilityId, scopeId);
  }
  if (isRolesCapabilityId(capabilityId)) {
    return can(auths.rolesAuth, capabilityId, scopeId);
  }
  if (capabilityId.startsWith('choir.devotion.')) {
    return can(auths.devotionAuth, capabilityId, scopeId);
  }
  if (
    capabilityId.startsWith('choir.document.')
    || capabilityId.startsWith('choir.uniform.')
    || capabilityId.startsWith('choir.equipment.')
  ) {
    return can(auths.logisticsAuth, capabilityId, scopeId);
  }
  if (capabilityId.startsWith('choir.voice.')) {
    return can(auths.voiceAuth, capabilityId, scopeId);
  }
  if (
    capabilityId.startsWith('choir.announcement.')
    || capabilityId.startsWith('choir.meeting.')
  ) {
    return can(auths.commsAuth, capabilityId, scopeId);
  }
  if (
    capabilityId.startsWith('choir.music.')
    || capabilityId.startsWith('choir.rehearsal.')
  ) {
    return can(auths.musicAuth, capabilityId, scopeId);
  }
  if (capabilityId.startsWith('choir.sponsor.')) {
    return can(auths.sponsorAuth, capabilityId, scopeId);
  }
  if (capabilityId.startsWith('choir.join.')) {
    return can(auths.joinAuth, capabilityId, scopeId);
  }
  if (
    capabilityId.startsWith('choir.ops.')
    || capabilityId === 'choir.report.export@choir'
  ) {
    return can(auths.opsAuth, capabilityId, scopeId);
  }
  if (capabilityId.startsWith('choir.discipline.')) {
    return can(auths.disciplineAuth, capabilityId, scopeId);
  }
  if (capabilityId.startsWith('choir.welfare.')) {
    return can(auths.welfareAuth, capabilityId, scopeId);
  }
  return can(auths.contributionAuth, capabilityId, scopeId);
}

export function buildCapabilityRouterFromAuths(
  auths: ChoirCapabilityAuths,
  scopeId?: string,
): (capabilityId: string) => boolean {
  return (capabilityId) => routeChoirCapability(capabilityId, auths, scopeId);
}
