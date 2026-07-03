import { uiCapabilityVisible as adminUiVisible } from '../choir/admin-hub-ui-capability-registry';
import { uiCapabilityVisible as advisorUiVisible } from '../choir/advisor-hub-ui-capability-registry';
import { uiCapabilityVisible as careUiVisible } from '../choir/care-hub-ui-capability-registry';
import { uiCapabilityVisible as commsUiVisible } from '../choir/comms-ui-capability-registry';
import { uiCapabilityVisible as disciplineUiVisible } from '../choir/discipline-ui-capability-registry';
import { uiCapabilityVisible as devotionUiVisible } from '../choir/devotion-ui-capability-registry';
import { uiCapabilityVisible as joinUiVisible } from '../choir/join-ui-capability-registry';
import { uiCapabilityVisible as logisticsUiVisible } from '../choir/logistics-ui-capability-registry';
import { uiCapabilityVisible as opsUiVisible } from '../choir/ops-ui-capability-registry';
import { uiCapabilityVisible as presidentUiVisible } from '../choir/president-hub-ui-capability-registry';
import { uiCapabilityVisible as recordsUiVisible } from '../choir/records-hub-ui-capability-registry';
import { uiCapabilityVisible as rosterUiVisible } from '../choir/roster-ui-capability-registry';
import { uiCapabilityVisible as rolesUiVisible } from '../choir/roles-ui-capability-registry';
import { uiCapabilityVisible as sponsorUiVisible } from '../choir/sponsor-ui-capability-registry';
import { uiCapabilityVisible as vicePresidentUiVisible } from '../choir/vice-president-hub-ui-capability-registry';
import { uiCapabilityVisible as voiceUiVisible } from '../choir/voice-ui-capability-registry';
import { uiCapabilityVisible as welfareUiVisible } from '../choir/welfare-ui-capability-registry';
import { adminHubNavGateForPath } from './admin-hub-nav';
import { advisorHubNavGateForPath } from './advisor-hub-nav';
import { careHubNavGateForPath } from './care-hub-nav';
import { commsNavGateForPath } from './comms-nav';
import {
  pageAccessForContributionRouteWithCheck,
} from './contribution-nav';
import { disciplineNavGateForPath } from './discipline-nav';
import { devotionNavGateForPath } from './devotion-nav';
import { pageAccessForFamilyRouteWithCheck } from './family-nav';
import { joinNavGateForPath } from './join-nav';
import { logisticsNavGateForPath } from './logistics-nav';
import { pageAccessForMusicRouteWithCheck } from './music-nav';
import { opsNavGateForPath } from './ops-nav';
import { presidentHubNavGateForPath } from './president-hub-nav';
import { recordsHubNavGateForPath } from './records-hub-nav';
import type { NavItem, NavSection } from './role-nav';
import { rosterNavGateForPath } from './roster-nav';
import { rolesNavGateForPath } from './roles-nav';
import { sponsorNavGateForPath } from './sponsor-nav';
import { vicePresidentHubNavGateForPath } from './vice-president-hub-nav';
import { voiceNavGateForPath } from './voice-nav';
import { welfareNavGateForPath } from './welfare-nav';

export type RoleNavCapCheck = (capabilityId: string, scopeId?: string) => boolean;

function gateVisible(
  path: string,
  gateForPath: (path: string) => string | null,
  uiVisible: (uiId: string, check: RoleNavCapCheck) => boolean,
  check: RoleNavCapCheck,
): boolean {
  const uiId = gateForPath(path);
  if (!uiId) return true;
  return uiVisible(uiId, check);
}

/** Capability gate for a single choir nav path (legacy `/choir/*` or scoped). */
export function pageAccessForRoleNavPath(
  path: string,
  check: RoleNavCapCheck,
): boolean {
  return (
    gateVisible(path, careHubNavGateForPath, careUiVisible, check)
    && gateVisible(path, devotionNavGateForPath, devotionUiVisible, check)
    && pageAccessForContributionRouteWithCheck(path, check)
    && gateVisible(path, recordsHubNavGateForPath, recordsUiVisible, check)
    && gateVisible(path, presidentHubNavGateForPath, presidentUiVisible, check)
    && gateVisible(path, vicePresidentHubNavGateForPath, vicePresidentUiVisible, check)
    && pageAccessForMusicRouteWithCheck(path, check)
    && pageAccessForFamilyRouteWithCheck(path, check)
    && gateVisible(path, advisorHubNavGateForPath, advisorUiVisible, check)
    && gateVisible(path, welfareNavGateForPath, welfareUiVisible, check)
    && gateVisible(path, disciplineNavGateForPath, disciplineUiVisible, check)
    && gateVisible(path, opsNavGateForPath, opsUiVisible, check)
    && gateVisible(path, rosterNavGateForPath, rosterUiVisible, check)
    && gateVisible(path, commsNavGateForPath, commsUiVisible, check)
    && gateVisible(path, voiceNavGateForPath, voiceUiVisible, check)
    && gateVisible(path, logisticsNavGateForPath, logisticsUiVisible, check)
    && gateVisible(path, rolesNavGateForPath, rolesUiVisible, check)
    && gateVisible(path, adminHubNavGateForPath, adminUiVisible, check)
    && gateVisible(path, joinNavGateForPath, joinUiVisible, check)
    && gateVisible(path, sponsorNavGateForPath, sponsorUiVisible, check)
  );
}

function filterItems(items: NavItem[], check: RoleNavCapCheck): NavItem[] {
  return items.filter((item) => pageAccessForRoleNavPath(item.path, check));
}

/** Filter `NAV_BY_ROLE` sections when capability routing is active. */
export function filterRoleNavSections(
  sections: NavSection[],
  check: RoleNavCapCheck,
): NavSection[] {
  return sections
    .map((sec) => ({
      ...sec,
      items: filterItems(sec.items, check),
    }))
    .filter((sec) => sec.items.length > 0);
}
