export interface OperationalUnitListItem {
  id: string;
  ministryId: string;
  ministry: { id: string; code: string; name: string };
  code: string;
  name: string;
  description: string | null;
  type: string;
  isActive: boolean;
  memberCount: number;
  leadershipCount: number;
  createdAt: string;
}

export type OperationalUnitTab =
  | "overview"
  | "members"
  | "leadership"
  | "permissions"
  | "settings"
  | "activity";
