export interface MinistryListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  memberCount: number;
  leadershipCount: number;
  createdAt: string;
}

export interface MinistryDetail extends MinistryListItem {
  settings?: MinistrySettings | null;
  permissionCount?: number;
}

export interface MinistrySummary {
  ministryId: string;
  code: string;
  name: string;
  memberCount: number;
  activeLeaders: number;
  activePermissions: number;
  createdAt: string;
}

export interface MinistryMemberRow {
  id: string;
  ministryId: string;
  memberId: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberNumber: string | null;
    status: string;
  };
  joinedAt: string;
  status: string;
  notes: string | null;
}

export interface MinistryLeadershipPosition {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
}

export interface MinistryLeadershipAssignment {
  id: string;
  memberId: string;
  positionId: string;
  startedAt: string;
  endedAt: string | null;
  member: MinistryMemberRow["member"];
  position: MinistryLeadershipPosition;
}

export interface MinistryPermissionRow {
  id: string;
  ministryId: string;
  memberId: string;
  permission: string;
  grantedAt: string;
  member: MinistryMemberRow["member"];
}

export interface MinistrySettings {
  ministryId: string;
  allowDevotions: boolean;
  allowAnnouncements: boolean;
  allowDocuments: boolean;
  allowMeetings: boolean;
  allowAssets: boolean;
  allowOperationalUnits: boolean;
  allowReporting: boolean;
}

export interface MinistryActivityRow {
  id: string;
  type: string;
  summary: string | null;
  createdAt: string;
  actor?: { email: string };
}

export type MinistryTab =
  | "overview"
  | "members"
  | "units"
  | "leadership"
  | "announcements"
  | "documents"
  | "meetings"
  | "reports"
  | "activity"
  | "permissions"
  | "settings";
