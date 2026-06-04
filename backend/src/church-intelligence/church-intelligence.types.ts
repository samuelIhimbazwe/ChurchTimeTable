import {
  ChurchActivityType,
  GovernanceAlertType,
  MinistryHealthStatus,
} from '@prisma/client';

export interface ChurchHealthSummary {
  ministryCount: number;
  activeMinistryCount: number;
  operationalUnitCount: number;
  activeOperationalUnitCount: number;
  totalMembers: number;
  activeMembers: number;
  leadershipAssignments: number;
  meetingsLast30Days: number;
  announcementsLast30Days: number;
  reportsGeneratedLast30Days: number;
  devotionsPublishedLast30Days: number;
  assetsCount: number;
  activeAssets: number;
  fundsCount: number;
  activeBudgets: number;
}

export interface MinistryHealthScore {
  ministryId: string;
  ministryName: string;
  ministryCode: string;
  engagementScore: number;
  leadershipScore: number;
  activityScore: number;
  communicationScore: number;
  operationalScore: number;
  overallScore: number;
  status: MinistryHealthStatus;
  memberCount: number;
  growthTrend: 'up' | 'down' | 'stable';
}

export interface OperationalUnitHealthScore {
  operationalUnitId: string;
  operationalUnitName: string;
  ministryId: string;
  ministryName: string;
  attendanceTrend: 'up' | 'down' | 'stable';
  activityScore: number;
  leadershipScore: number;
  meetingsScore: number;
  reportsScore: number;
  overallScore: number;
  status: MinistryHealthStatus;
  memberCount: number;
}

export interface GovernanceAlert {
  id: string;
  type: GovernanceAlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  ministryId?: string;
  ministryName?: string;
  operationalUnitId?: string;
  operationalUnitName?: string;
  memberId?: string;
  actionHint?: string;
}

export interface ChurchActivityFeedItem {
  id: string;
  type: ChurchActivityType;
  title: string;
  summary?: string;
  ministryId?: string;
  ministryName?: string;
  operationalUnitId?: string;
  operationalUnitName?: string;
  actorLabel?: string;
  createdAt: string;
}

export interface LeadershipAnalytics {
  memberId: string;
  memberName: string;
  activeAssignments: number;
  averageAssignmentDays: number | null;
  meetingsChaired: number;
  reportsSubmitted: number;
  activityLevel: 'high' | 'medium' | 'low' | 'inactive';
  assignments: Array<{
    scope: 'MINISTRY' | 'OPERATIONAL_UNIT';
    positionName: string;
    contextName: string;
    startedAt: string;
    endedAt?: string | null;
  }>;
}
