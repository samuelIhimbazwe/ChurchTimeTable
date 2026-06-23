'use client';

import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider';
import { can, hasAnyCapability } from '@/lib/choir/capability-can';
import { routeChoirCapability } from '@/lib/choir/capability-router';
import type { ResolvedAuth } from '@/lib/choir/capability.types';
import { uiCapabilityVisible as contributionUiVisible } from '@/lib/choir/contribution-ui-capability-registry';
import {
  uiCapabilityVisible as welfareUiVisible,
  isWelfareUiCapability,
} from '@/lib/choir/welfare-ui-capability-registry';
import {
  uiCapabilityVisible as disciplineUiVisible,
  isDisciplineUiCapability,
} from '@/lib/choir/discipline-ui-capability-registry';
import {
  uiCapabilityVisible as opsUiVisible,
  isOpsUiCapability,
} from '@/lib/choir/ops-ui-capability-registry';
import {
  uiCapabilityVisible as joinUiVisible,
  isJoinUiCapability,
} from '@/lib/choir/join-ui-capability-registry';
import {
  uiCapabilityVisible as sponsorUiVisible,
  isSponsorUiCapability,
} from '@/lib/choir/sponsor-ui-capability-registry';
import {
  uiCapabilityVisible as musicUiVisible,
  isMusicUiCapability,
} from '@/lib/choir/music-ui-capability-registry';
import {
  uiCapabilityVisible as rosterUiVisible,
  isRosterUiCapability,
} from '@/lib/choir/roster-ui-capability-registry';
import {
  uiCapabilityVisible as commsUiVisible,
  isCommsUiCapability,
} from '@/lib/choir/comms-ui-capability-registry';
import {
  uiCapabilityVisible as voiceUiVisible,
  isVoiceUiCapability,
} from '@/lib/choir/voice-ui-capability-registry';
import {
  uiCapabilityVisible as logisticsUiVisible,
  isLogisticsUiCapability,
} from '@/lib/choir/logistics-ui-capability-registry';
import {
  uiCapabilityVisible as devotionUiVisible,
  isDevotionUiCapability,
} from '@/lib/choir/devotion-ui-capability-registry';
import {
  uiCapabilityVisible as rolesUiVisible,
  isRolesUiCapability,
} from '@/lib/choir/roles-ui-capability-registry';
import {
  uiCapabilityVisible as adminHubUiVisible,
  isAdminHubUiCapability,
} from '@/lib/choir/admin-hub-ui-capability-registry';
import {
  uiCapabilityVisible as choirHubUiVisible,
  isChoirHubUiCapability,
} from '@/lib/choir/choir-hub-ui-capability-registry';
import {
  uiCapabilityVisible as careHubUiVisible,
  isCareHubUiCapability,
} from '@/lib/choir/care-hub-ui-capability-registry';
import {
  uiCapabilityVisible as advisorHubUiVisible,
  isAdvisorHubUiCapability,
} from '@/lib/choir/advisor-hub-ui-capability-registry';
import {
  uiCapabilityVisible as recordsHubUiVisible,
  isRecordsHubUiCapability,
} from '@/lib/choir/records-hub-ui-capability-registry';
import {
  uiCapabilityVisible as presidentHubUiVisible,
  isPresidentHubUiCapability,
} from '@/lib/choir/president-hub-ui-capability-registry';
import {
  uiCapabilityVisible as vicePresidentHubUiVisible,
  isVicePresidentHubUiCapability,
} from '@/lib/choir/vice-president-hub-ui-capability-registry';

const MEMBER_VIEW_CAP = 'choir.member.view@choir';

function isRosterViewCapabilityId(id: string): boolean {
  return id === MEMBER_VIEW_CAP;
}

export function useContributionAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.contributionAuth;
}

export function useWelfareAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.welfareAuth;
}

export function useDisciplineAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.disciplineAuth;
}

export function useOpsAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.opsAuth;
}

export function useJoinAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.joinAuth;
}

export function useSponsorAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.sponsorAuth;
}

export function useMusicAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.musicAuth;
}

export function useRosterAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.rosterAuth;
}

export function useCommsAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.commsAuth;
}

export function useVoiceAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.voiceAuth;
}

export function useLogisticsAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.logisticsAuth;
}

export function useDevotionAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.devotionAuth;
}

export function useRolesAuth(): ResolvedAuth | undefined {
  return useOptionalChoirDashboardCtx()?.context?.rolesAuth;
}

function isWelfareCapabilityId(id: string): boolean {
  return id.startsWith('choir.welfare.');
}

function isDisciplineCapabilityId(id: string): boolean {
  return id.startsWith('choir.discipline.');
}

function isOpsCapabilityId(id: string): boolean {
  return id.startsWith('choir.ops.') || id === 'choir.report.export@choir';
}

function isJoinCapabilityId(id: string): boolean {
  return id.startsWith('choir.join.');
}

function isSponsorCapabilityId(id: string): boolean {
  return id.startsWith('choir.sponsor.');
}

function isMusicCapabilityId(id: string): boolean {
  return id.startsWith('choir.music.') || id.startsWith('choir.rehearsal.');
}

function isCommsCapabilityId(id: string): boolean {
  return id.startsWith('choir.announcement.') || id.startsWith('choir.meeting.');
}

function isVoiceCapabilityId(id: string): boolean {
  return id.startsWith('choir.voice.');
}

function isLogisticsCapabilityId(id: string): boolean {
  return (
    id.startsWith('choir.document.')
    || id.startsWith('choir.uniform.')
    || id.startsWith('choir.equipment.')
  );
}

function isDevotionCapabilityId(id: string): boolean {
  return id.startsWith('choir.devotion.');
}

function isRolesCapabilityId(id: string): boolean {
  return (
    id.startsWith('choir.custom_role.')
    || id.startsWith('choir.committee_role.')
    || id.startsWith('choir.committee_member.')
  );
}

const MEMBER_MANAGE_CAP = 'choir.member.manage@choir';

function isMemberManageCapabilityId(id: string): boolean {
  return id === MEMBER_MANAGE_CAP;
}

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

function canWithRouting(
  capabilityId: string,
  rolesAuth: ResolvedAuth | undefined,
  devotionAuth: ResolvedAuth | undefined,
  logisticsAuth: ResolvedAuth | undefined,
  voiceAuth: ResolvedAuth | undefined,
  commsAuth: ResolvedAuth | undefined,
  rosterAuth: ResolvedAuth | undefined,
  musicAuth: ResolvedAuth | undefined,
  joinAuth: ResolvedAuth | undefined,
  sponsorAuth: ResolvedAuth | undefined,
  opsAuth: ResolvedAuth | undefined,
  disciplineAuth: ResolvedAuth | undefined,
  welfareAuth: ResolvedAuth | undefined,
  contributionAuth: ResolvedAuth | undefined,
  scopeId?: string,
): boolean {
  return routeChoirCapability(
    capabilityId,
    {
      rolesAuth,
      devotionAuth,
      logisticsAuth,
      voiceAuth,
      commsAuth,
      rosterAuth,
      musicAuth,
      joinAuth,
      sponsorAuth,
      opsAuth,
      disciplineAuth,
      welfareAuth,
      contributionAuth,
    },
    scopeId,
  );
}

export function useCapability(capabilityId: string, scopeId?: string): boolean {
  return canWithRouting(
    capabilityId,
    useRolesAuth(),
    useDevotionAuth(),
    useLogisticsAuth(),
    useVoiceAuth(),
    useCommsAuth(),
    useRosterAuth(),
    useMusicAuth(),
    useJoinAuth(),
    useSponsorAuth(),
    useOpsAuth(),
    useDisciplineAuth(),
    useWelfareAuth(),
    useContributionAuth(),
    scopeId,
  );
}

export function useAnyCapability(
  capabilityIds: string[],
  scopeId?: string,
): boolean {
  const memberManageIds = capabilityIds.filter(isMemberManageCapabilityId);
  const rosterViewIds = capabilityIds.filter(isRosterViewCapabilityId);
  const rolesIds = capabilityIds.filter(isRolesCapabilityId);
  const devotionIds = capabilityIds.filter(isDevotionCapabilityId);
  const logisticsIds = capabilityIds.filter(isLogisticsCapabilityId);
  const voiceIds = capabilityIds.filter(isVoiceCapabilityId);
  const commsIds = capabilityIds.filter(isCommsCapabilityId);
  const musicIds = capabilityIds.filter(isMusicCapabilityId);
  const sponsorIds = capabilityIds.filter(isSponsorCapabilityId);
  const joinIds = capabilityIds.filter(isJoinCapabilityId);
  const opsIds = capabilityIds.filter(isOpsCapabilityId);
  const disciplineIds = capabilityIds.filter(isDisciplineCapabilityId);
  const welfareIds = capabilityIds.filter(isWelfareCapabilityId);
  const contributionIds = capabilityIds.filter(
    (id) =>
      !isMemberManageCapabilityId(id)
      && !isRosterViewCapabilityId(id)
      && !isRolesCapabilityId(id)
      && !isDevotionCapabilityId(id)
      && !isLogisticsCapabilityId(id)
      && !isVoiceCapabilityId(id)
      && !isCommsCapabilityId(id)
      && !isMusicCapabilityId(id)
      && !isSponsorCapabilityId(id)
      && !isJoinCapabilityId(id)
      && !isOpsCapabilityId(id)
      && !isDisciplineCapabilityId(id)
      && !isWelfareCapabilityId(id),
  );
  const rolesAuth = useRolesAuth();
  const devotionAuth = useDevotionAuth();
  const logisticsAuth = useLogisticsAuth();
  const voiceAuth = useVoiceAuth();
  const commsAuth = useCommsAuth();
  const rosterAuth = useRosterAuth();
  const musicAuth = useMusicAuth();
  const joinAuth = useJoinAuth();
  const sponsorAuth = useSponsorAuth();
  const opsAuth = useOpsAuth();
  const disciplineAuth = useDisciplineAuth();
  const welfareAuth = useWelfareAuth();
  const contributionAuth = useContributionAuth();
  const memberManageOk =
    memberManageIds.length === 0
    || canMemberManage(joinAuth, sponsorAuth, rosterAuth);
  const rosterViewOk =
    rosterViewIds.length === 0
    || hasAnyCapability(rosterAuth, rosterViewIds, scopeId);
  const rolesOk =
    rolesIds.length === 0 || hasAnyCapability(rolesAuth, rolesIds, scopeId);
  const devotionOk =
    devotionIds.length === 0
    || hasAnyCapability(devotionAuth, devotionIds, scopeId);
  const logisticsOk =
    logisticsIds.length === 0
    || hasAnyCapability(logisticsAuth, logisticsIds, scopeId);
  const voiceOk =
    voiceIds.length === 0 || hasAnyCapability(voiceAuth, voiceIds, scopeId);
  const commsOk =
    commsIds.length === 0 || hasAnyCapability(commsAuth, commsIds, scopeId);
  const musicOk =
    musicIds.length === 0 || hasAnyCapability(musicAuth, musicIds, scopeId);
  const sponsorOk =
    sponsorIds.length === 0
    || hasAnyCapability(sponsorAuth, sponsorIds, scopeId);
  const joinOk =
    joinIds.length === 0 || hasAnyCapability(joinAuth, joinIds, scopeId);
  const opsOk =
    opsIds.length === 0 || hasAnyCapability(opsAuth, opsIds, scopeId);
  const disciplineOk =
    disciplineIds.length === 0
    || hasAnyCapability(disciplineAuth, disciplineIds, scopeId);
  const welfareOk =
    welfareIds.length === 0
    || hasAnyCapability(welfareAuth, welfareIds, scopeId);
  const contributionOk =
    contributionIds.length === 0
    || hasAnyCapability(contributionAuth, contributionIds, scopeId);
  return (
    memberManageOk
    && rosterViewOk
    && rolesOk
    && devotionOk
    && logisticsOk
    && voiceOk
    && commsOk
    && musicOk
    && sponsorOk
    && joinOk
    && opsOk
    && disciplineOk
    && welfareOk
    && contributionOk
  );
}

export function useUiCapability(uiId: string, scopeId?: string): boolean {
  const rolesAuth = useRolesAuth();
  const devotionAuth = useDevotionAuth();
  const logisticsAuth = useLogisticsAuth();
  const voiceAuth = useVoiceAuth();
  const commsAuth = useCommsAuth();
  const rosterAuth = useRosterAuth();
  const musicAuth = useMusicAuth();
  const joinAuth = useJoinAuth();
  const sponsorAuth = useSponsorAuth();
  const opsAuth = useOpsAuth();
  const disciplineAuth = useDisciplineAuth();
  const welfareAuth = useWelfareAuth();
  const contributionAuth = useContributionAuth();

  const routeCheck = (capId: string) =>
    canWithRouting(
      capId,
      rolesAuth,
      devotionAuth,
      logisticsAuth,
      voiceAuth,
      commsAuth,
      rosterAuth,
      musicAuth,
      joinAuth,
      sponsorAuth,
      opsAuth,
      disciplineAuth,
      welfareAuth,
      contributionAuth,
      scopeId,
    );

  if (isAdminHubUiCapability(uiId)) {
    return adminHubUiVisible(uiId, routeCheck);
  }
  if (isChoirHubUiCapability(uiId)) {
    return choirHubUiVisible(uiId, routeCheck);
  }
  if (isCareHubUiCapability(uiId)) {
    return careHubUiVisible(uiId, routeCheck);
  }
  if (isAdvisorHubUiCapability(uiId)) {
    return advisorHubUiVisible(uiId, routeCheck);
  }
  if (isRecordsHubUiCapability(uiId)) {
    return recordsHubUiVisible(uiId, routeCheck);
  }
  if (isPresidentHubUiCapability(uiId)) {
    return presidentHubUiVisible(uiId, routeCheck);
  }
  if (isVicePresidentHubUiCapability(uiId)) {
    return vicePresidentHubUiVisible(uiId, routeCheck);
  }
  if (isRolesUiCapability(uiId)) {
    return rolesUiVisible(uiId, (capId) => can(rolesAuth, capId));
  }
  if (isDevotionUiCapability(uiId)) {
    return devotionUiVisible(uiId, (capId) => can(devotionAuth, capId));
  }
  if (isLogisticsUiCapability(uiId)) {
    return logisticsUiVisible(uiId, (capId) => can(logisticsAuth, capId));
  }
  if (isVoiceUiCapability(uiId)) {
    return voiceUiVisible(uiId, (capId) => can(voiceAuth, capId));
  }
  if (isCommsUiCapability(uiId)) {
    return commsUiVisible(uiId, (capId) => can(commsAuth, capId));
  }
  if (isRosterUiCapability(uiId)) {
    return rosterUiVisible(uiId, (capId) =>
      capId === MEMBER_MANAGE_CAP
        ? canMemberManage(joinAuth, sponsorAuth, rosterAuth)
        : can(rosterAuth, capId),
    );
  }
  if (isMusicUiCapability(uiId)) {
    if (uiId === 'music-notify-members') {
      return musicUiVisible(uiId, routeCheck);
    }
    return musicUiVisible(uiId, (capId) => can(musicAuth, capId));
  }
  if (isSponsorUiCapability(uiId)) {
    return sponsorUiVisible(uiId, (capId) =>
      capId === MEMBER_MANAGE_CAP
        ? canMemberManage(joinAuth, sponsorAuth, rosterAuth)
        : can(sponsorAuth, capId),
    );
  }
  if (isJoinUiCapability(uiId)) {
    return joinUiVisible(uiId, (capId) =>
      capId === MEMBER_MANAGE_CAP
        ? canMemberManage(joinAuth, sponsorAuth, rosterAuth)
        : can(joinAuth, capId),
    );
  }
  if (isOpsUiCapability(uiId)) {
    if (uiId === 'ops-reports-hub') {
      return opsUiVisible(uiId, routeCheck);
    }
    return opsUiVisible(uiId, (capId) => can(opsAuth, capId));
  }
  if (isDisciplineUiCapability(uiId)) {
    return disciplineUiVisible(uiId, (capId) => can(disciplineAuth, capId));
  }
  if (isWelfareUiCapability(uiId)) {
    return welfareUiVisible(uiId, (capId) => can(welfareAuth, capId));
  }
  return contributionUiVisible(
    uiId,
    (capId, famId) => can(contributionAuth, capId, famId ?? scopeId),
    scopeId,
  );
}

export function useSponsorCapability(capabilityId: string): boolean {
  if (isMemberManageCapabilityId(capabilityId)) {
    return canMemberManage(useJoinAuth(), useSponsorAuth(), useRosterAuth());
  }
  const auth = useSponsorAuth();
  return can(auth, capabilityId);
}

export function useSponsorUiCapability(uiId: string): boolean {
  const joinAuth = useJoinAuth();
  const sponsorAuth = useSponsorAuth();
  const rosterAuth = useRosterAuth();
  return sponsorUiVisible(uiId, (capId) =>
    capId === MEMBER_MANAGE_CAP
      ? canMemberManage(joinAuth, sponsorAuth, rosterAuth)
      : can(sponsorAuth, capId),
  );
}

export function useJoinCapability(capabilityId: string): boolean {
  if (isMemberManageCapabilityId(capabilityId)) {
    return canMemberManage(useJoinAuth(), useSponsorAuth(), useRosterAuth());
  }
  const auth = useJoinAuth();
  return can(auth, capabilityId);
}

export function useJoinUiCapability(uiId: string): boolean {
  const joinAuth = useJoinAuth();
  const sponsorAuth = useSponsorAuth();
  const rosterAuth = useRosterAuth();
  return joinUiVisible(uiId, (capId) =>
    capId === MEMBER_MANAGE_CAP
      ? canMemberManage(joinAuth, sponsorAuth, rosterAuth)
      : can(joinAuth, capId),
  );
}

export function useOpsCapability(capabilityId: string): boolean {
  const auth = useOpsAuth();
  return can(auth, capabilityId);
}

export function useOpsUiCapability(uiId: string): boolean {
  const auth = useOpsAuth();
  return opsUiVisible(uiId, (capId) => can(auth, capId));
}

export function useDisciplineCapability(capabilityId: string): boolean {
  const auth = useDisciplineAuth();
  return can(auth, capabilityId);
}

export function useDisciplineUiCapability(uiId: string): boolean {
  const auth = useDisciplineAuth();
  return disciplineUiVisible(uiId, (capId) => can(auth, capId));
}

export function useMusicCapability(capabilityId: string): boolean {
  const auth = useMusicAuth();
  return can(auth, capabilityId);
}

export function useMusicUiCapability(uiId: string): boolean {
  const auth = useMusicAuth();
  if (uiId === 'music-notify-members') {
    const routeCheck = useCapabilityRouter();
    return musicUiVisible(uiId, routeCheck);
  }
  return musicUiVisible(uiId, (capId) => can(auth, capId));
}

export function useRosterCapability(capabilityId: string): boolean {
  if (isMemberManageCapabilityId(capabilityId)) {
    return canMemberManage(useJoinAuth(), useSponsorAuth(), useRosterAuth());
  }
  const auth = useRosterAuth();
  return can(auth, capabilityId);
}

export function useRosterUiCapability(uiId: string): boolean {
  const joinAuth = useJoinAuth();
  const sponsorAuth = useSponsorAuth();
  const rosterAuth = useRosterAuth();
  return rosterUiVisible(uiId, (capId) =>
    capId === MEMBER_MANAGE_CAP
      ? canMemberManage(joinAuth, sponsorAuth, rosterAuth)
      : can(rosterAuth, capId),
  );
}

export function useCommsCapability(capabilityId: string): boolean {
  const auth = useCommsAuth();
  return can(auth, capabilityId);
}

export function useCommsUiCapability(uiId: string): boolean {
  const auth = useCommsAuth();
  return commsUiVisible(uiId, (capId) => can(auth, capId));
}

export function useVoiceCapability(capabilityId: string): boolean {
  const auth = useVoiceAuth();
  return can(auth, capabilityId);
}

export function useVoiceUiCapability(uiId: string): boolean {
  const auth = useVoiceAuth();
  return voiceUiVisible(uiId, (capId) => can(auth, capId));
}

export function useLogisticsCapability(capabilityId: string): boolean {
  const auth = useLogisticsAuth();
  return can(auth, capabilityId);
}

export function useLogisticsUiCapability(uiId: string): boolean {
  const auth = useLogisticsAuth();
  return logisticsUiVisible(uiId, (capId) => can(auth, capId));
}

export function useDevotionCapability(capabilityId: string): boolean {
  const auth = useDevotionAuth();
  return can(auth, capabilityId);
}

export function useDevotionUiCapability(uiId: string): boolean {
  const auth = useDevotionAuth();
  return devotionUiVisible(uiId, (capId) => can(auth, capId));
}

export function useRolesCapability(capabilityId: string): boolean {
  const auth = useRolesAuth();
  return can(auth, capabilityId);
}

export function useRolesUiCapability(uiId: string): boolean {
  const auth = useRolesAuth();
  return rolesUiVisible(uiId, (capId) => can(auth, capId));
}

/** Route a capability id across all choir-scoped auth blobs (for composite UI gates). */
export function useCapabilityRouter(scopeId?: string): (capId: string) => boolean {
  const rolesAuth = useRolesAuth();
  const devotionAuth = useDevotionAuth();
  const logisticsAuth = useLogisticsAuth();
  const voiceAuth = useVoiceAuth();
  const commsAuth = useCommsAuth();
  const rosterAuth = useRosterAuth();
  const musicAuth = useMusicAuth();
  const joinAuth = useJoinAuth();
  const sponsorAuth = useSponsorAuth();
  const opsAuth = useOpsAuth();
  const disciplineAuth = useDisciplineAuth();
  const welfareAuth = useWelfareAuth();
  const contributionAuth = useContributionAuth();

  return (capId: string) =>
    canWithRouting(
      capId,
      rolesAuth,
      devotionAuth,
      logisticsAuth,
      voiceAuth,
      commsAuth,
      rosterAuth,
      musicAuth,
      joinAuth,
      sponsorAuth,
      opsAuth,
      disciplineAuth,
      welfareAuth,
      contributionAuth,
      scopeId,
    );
}

export function useAdminHubUiCapability(uiId: string, scopeId?: string): boolean {
  const routeCheck = useCapabilityRouter(scopeId);
  return adminHubUiVisible(uiId, routeCheck);
}

export function useChoirHubUiCapability(uiId: string, scopeId?: string): boolean {
  const routeCheck = useCapabilityRouter(scopeId);
  return choirHubUiVisible(uiId, routeCheck);
}

export function useCareHubUiCapability(uiId: string, scopeId?: string): boolean {
  const routeCheck = useCapabilityRouter(scopeId);
  return careHubUiVisible(uiId, routeCheck);
}
