export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface ApiMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiListResponse<T> {
  items: T[];
  meta: ApiMeta;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: "Bearer";
}

export interface AuthProfile {
  id: string;
  email: string;
  preferredLanguage?: string | null;
  roles: string[];
  permissions: string[];
  member?: {
    firstName?: string | null;
    lastName?: string | null;
    ministry?: string | null;
  } | null;
}

export interface ChartPoint {
  label: string;
  count?: number;
  present?: number;
  absent?: number;
  late?: number;
  total?: number;
}

export interface DashboardStatItem {
  label: string;
  count: number;
}

export interface EventSnapshot {
  id: string;
  title: string;
  startTime: string;
  endTime: string | null;
  location: string | null;
  ministryScope?: string | null;
  status: string;
}

export interface AttendanceRecord {
  id: string;
  createdAt: string;
  physicalStatus: string;
  reasonCategory: string | null;
  event?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string | null;
  } | null;
}

export interface DashboardNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface MemberContributionProgress {
  total: number;
  paid: number;
  unpaid: number;
  completionRate: number;
  outstandingAmount: number;
  recent: Array<{
    period: string;
    amount: number;
    paid: boolean;
    paidAt: string | null;
  }>;
}

export interface LeaderDashboardSummary {
  upcomingEvents: number;
  pendingSwaps: number;
  pendingReplacements: number;
  activeDiscipline: number;
  attendanceRate: number | null;
  attendanceSummary: {
    total: number;
    byStatus?: Record<string, number>;
  };
  upcomingEventList: EventSnapshot[];
  attendanceTrend: ChartPoint[];
  ministryAnalytics: DashboardStatItem[];
  reliabilityBands: DashboardStatItem[];
  financeSummary: {
    income: number;
    expense: number;
    balance: number;
    count: number;
  };
  syncConflicts: number;
  recentAudit: Array<{
    id: string;
    action: string;
    entity: string;
    createdAt: string;
    user?: {
      email: string;
    } | null;
  }>;
  teamReliability: Array<{
    label: string;
    compatibilityRate: number;
    size: number;
  }>;
  replacementFrequency: Array<{
    label: string;
    official: number;
    voluntary: number;
  }>;
  permissionWidgets: {
    treasurer: boolean;
    discipline: boolean;
    secretary: boolean;
    operationsManager: boolean;
    protocolCoordinator: boolean;
    protocolPresident: boolean;
  };
}

export interface MemberDashboardSummary {
  upcomingAssignments: number;
  pendingSwaps: number;
  attendanceRecent: AttendanceRecord[];
  attendanceRate: number | null;
  responsibilityScore: number | null;
  upcomingSchedule: Array<{
    id: string;
    event: EventSnapshot;
  }>;
  recentNotifications: DashboardNotification[];
  contributionProgress: MemberContributionProgress;
  history: {
    protocolTeamHistory: Array<{
      id: string;
      team: {
        id: string;
        month: number;
        year: number;
        serviceType: string;
        status: string;
      };
      createdAt: string;
    }>;
    committeeRoleHistory: Array<{
      id: string;
      assignedAt: string;
      role: {
        id: string;
        name: string;
      };
    }>;
  };
  permissionWidgets: {
    replacements: boolean;
    attendanceTools: boolean;
    financeSnapshot: boolean;
  };
}

export interface AdminDashboardSummary {
  systemStats: {
    users: number;
    members: number;
    events: number;
    auditLogs: number;
    syncConflicts: number;
  };
  recentAudit: Array<{
    id: string;
    action: string;
    entity: string;
    createdAt: string;
    user?: {
      email: string;
    } | null;
  }>;
  syncDiagnostics: {
    totalConflicts: number;
    staleConflicts: number;
    myConflicts: number;
    recentConflicts: Array<{
      id: string;
      entity: string;
      entityId: string;
      reason: string;
      createdAt: string;
      userId: string;
    }>;
  };
  auditActivityTrend: Array<{
    label: string;
    count: number;
  }>;
  roleDistribution: DashboardStatItem[];
  health: {
    status: "healthy" | "attention";
    generatedAt: string;
  };
  analytics: {
    choirCompatibilityRate: number;
  };
  permissionWidgets: {
    committeeGovernance: boolean;
    protocolOversight: boolean;
    auditInsights: boolean;
  };
}

export type EventType =
  | "CHOIR_SERVICE"
  | "REHEARSAL"
  | "CONCERT"
  | "PROTOCOL_SERVICE"
  | "CHURCH_EVENT"
  | "SERVICE_1"
  | "SERVICE_2"
  | "TUESDAY"
  | "IGABURO";

export type MinistryScope = "CHOIR" | "PROTOCOL" | "BOTH";
export type EventStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface EventItem {
  id: string;
  title: string;
  type: EventType;
  startTime: string;
  endTime: string;
  location: string | null;
  ministryScope: MinistryScope;
  status: EventStatus;
  serviceSlot: number | null;
  metadata?: {
    description?: string;
    recurrenceRule?: string;
  } | null;
  _count?: {
    assignments: number;
  };
}

export type EventListResponse = ApiListResponse<EventItem>;

export interface EventAssignment {
  id: string;
  eventId: string;
  memberId: string;
  role?: string | null;
  isOverride: boolean;
  overrideReason?: string | null;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    ministry: MinistryScope;
    status: string;
  };
}

export type EventAssignmentListResponse = ApiListResponse<EventAssignment>;

export interface EventFormInput {
  title: string;
  type: EventType;
  startTime: string;
  endTime: string;
  location?: string;
  ministryScope: MinistryScope;
  status?: EventStatus;
  serviceSlot?: number;
  description?: string;
  recurrenceRule?: string;
}

export interface AssignmentFormInput {
  eventId: string;
  memberId: string;
  role?: string;
  isOverride?: boolean;
  overrideReason?: string;
}

export interface AssignmentValidationResponse {
  valid: boolean;
  code?: string;
  message?: string;
}

export interface RotationPoolItem {
  memberId: string;
  firstName: string;
  lastName: string;
  ministry: MinistryScope;
  recentAssignmentCount: number;
  lastAssignedAt: string | null;
}
