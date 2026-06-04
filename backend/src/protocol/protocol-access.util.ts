import { PERMISSIONS } from '../common/constants/roles';
import {
  hasEffectivePermission,
  hasProtocolCoordination,
  hasProtocolOversight,
} from '../common/governance/governance-permissions.util';

export function hasProtocolView(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_VIEW) ||
    hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_MANAGE) ||
    hasProtocolCoordination(permissions) ||
    hasProtocolOversight(permissions)
  );
}

export function hasProtocolManage(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_MANAGE) ||
    hasProtocolCoordination(permissions)
  );
}

export function hasProtocolTeamApprove(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_TEAM_APPROVE) ||
    hasProtocolManage(permissions)
  );
}

export function hasProtocolTeamPublish(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_TEAM_PUBLISH) ||
    hasProtocolManage(permissions)
  );
}

export function hasProtocolAttendanceManage(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_ATTENDANCE_MANAGE) ||
    hasProtocolManage(permissions)
  );
}

export function hasProtocolReplacementManage(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_REPLACEMENT_MANAGE) ||
    hasProtocolManage(permissions)
  );
}

export function hasProtocolRankingView(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_RANKING_VIEW) ||
    hasProtocolManage(permissions) ||
    hasProtocolOversight(permissions)
  );
}

export function hasProtocolReport(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_REPORT) ||
    hasProtocolView(permissions)
  );
}

export function hasProtocolTeamLeaderManage(permissions: string[]): boolean {
  return (
    hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_TEAM_LEADER_MANAGE) ||
    hasProtocolManage(permissions)
  );
}

export function hasProtocolTeamLeaderExecute(permissions: string[]): boolean {
  return hasEffectivePermission(
    permissions,
    PERMISSIONS.PROTOCOL_TEAM_LEADER_EXECUTE,
  );
}
