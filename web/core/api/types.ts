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
  expiresIn?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
}

export interface AuthProfile {
  id: string;
  email: string;
  preferredLanguage?: string | null;
  roles: string[];
  permissions: string[];
  onboardingCompleted?: boolean;
  member?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    ministry?: string | null;
    status?: string | null;
    onboardingCompleted?: boolean;
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
  attendanceRate?: number | null;
  reliabilityScore?: number | null;
  pendingReplacements?: number;
  pendingSwaps?: number;
  openDiscipline?: number;
  voluntaryServiceCount?: number;
  trendDirection?: "up" | "down" | "stable";
}

export interface DashboardWidgetConfig {
  id: string;
  category: string;
  priority: number;
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface MinistryAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  ministryScope?: string | null;
  memberId?: string;
  count?: number;
  actionHint?: string;
}

export interface PermissionWidgets {
  treasurer: boolean;
  discipline: boolean;
  secretary: boolean;
  operationsManager: boolean;
  protocolCoordinator: boolean;
  protocolPresident: boolean;
  choirLeader: boolean;
  teamHead: boolean;
  replacements: boolean;
  attendanceTools: boolean;
  financeSnapshot: boolean;
  financeStewardshipPanel: boolean;
  committeeGovernance: boolean;
  protocolOversight: boolean;
  auditInsights: boolean;
}

export interface MinistryIntelligence {
  ministryKpis: DashboardStatItem[];
  ministryHealth: {
    score: number;
    band: "excellent" | "good" | "attention";
    indicators: Array<{ label: string; value: number; weight: number }>;
  };
  workloadAnalytics: {
    overloadedMembers: number;
    underloadedMembers: number;
    replacementDependency: number;
    voluntaryExtraCount: number;
    fairnessImbalance: boolean;
  };
  operationalAnalytics: {
    activeTeams: number;
    pendingReplacements: number;
    escalatedCount: number;
    readinessWarnings: number;
    overloadAlerts: number;
    disciplineRiskCount: number;
    voluntaryContributions: number;
  };
  financeAnalytics: {
    income: number;
    expense: number;
    balance: number;
    unpaidBalance: number;
    unpaidMemberCount: number;
    complianceRate: number;
  };
  disciplineAnalytics: {
    openCases: number;
    pastoralReviewCount: number;
    repeatedLatenessCount: number;
  };
  choirSummary?: {
    totalMarked: number;
    excused: number;
    unexcused: number;
    repeatedLateness: number;
  };
}

export interface PersonalAnalytics {
  latenessCount: number;
  voluntaryServiceCount: number;
  replacementCount: number;
  swapCount: number;
  contributionCompliance: number | null;
  attendanceScore?: AttendanceScore | null;
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
  operationalStatus?: string | null;
  excuseReason?: string | null;
  voluntaryExtra?: boolean;
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
  upToDate?: boolean;
  recent: Array<{
    period: string;
    amount: number;
    paid: boolean;
    paidAt: string | null;
    ministryScope?: string;
    status?: string;
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
  permissionWidgets: PermissionWidgets;
  widgets: DashboardWidgetConfig[];
  alerts: MinistryAlert[];
  intelligence: MinistryIntelligence;
}

export interface MemberDashboardSummary {
  upcomingAssignments: number;
  pendingSwaps: number;
  attendanceRecent: AttendanceRecord[];
  attendanceRate: number | null;
  responsibilityScore: number | null;
  attendanceScore?: AttendanceScore | null;
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
  permissionWidgets: PermissionWidgets;
  widgets: DashboardWidgetConfig[];
  alerts: MinistryAlert[];
  personalAnalytics: PersonalAnalytics;
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
  permissionWidgets: PermissionWidgets;
  widgets: DashboardWidgetConfig[];
  alerts: MinistryAlert[];
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

export type AttendanceOperationalStatus =
  | "ATTENDED"
  | "LATE"
  | "EXCUSED_ABSENCE"
  | "UNEXCUSED_ABSENCE"
  | "REPLACEMENT_SERVED"
  | "VOLUNTARY_EXTRA_SERVICE";

export type AttendanceReplacementType = "OFFICIAL" | "LEADER_ASSIGNED" | "VOLUNTARY";

export type AttendanceEscalationLevel = "TEAM_HEAD" | "COORDINATOR" | "PRESIDENT";

export interface AttendanceRecordItem {
  id: string;
  eventId: string;
  memberId: string;
  physicalStatus: string;
  reasonCategory: string | null;
  operationalStatus: AttendanceOperationalStatus | null;
  excuseReason: string | null;
  replacementType: AttendanceReplacementType | null;
  countsAsOfficial: boolean;
  voluntaryExtra: boolean;
  lateMinutes: number | null;
  escalated: boolean;
  escalationLevel: AttendanceEscalationLevel | null;
  escalationNotes: string | null;
  notes: string | null;
  approvedById?: string | null;
  createdAt: string;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  event?: EventSnapshot;
}

export interface AttendanceUpsertInput {
  eventId: string;
  memberId: string;
  physicalStatus: "PRESENT" | "ABSENT" | "LATE";
  reasonCategory?: "EXCUSED" | "UNEXCUSED";
  operationalStatus?: AttendanceOperationalStatus;
  excuseReason?: string;
  reasonType?: string;
  replacementType?: AttendanceReplacementType;
  countsAsOfficial?: boolean;
  voluntaryExtra?: boolean;
  lateMinutes?: number;
  excuseEvidenceUrl?: string;
  excuseApproved?: boolean;
  notes?: string;
}

export interface AttendanceScore {
  percentage: number;
  band: "excellent" | "good" | "danger";
  bandLabel: string;
  tone: "success" | "info" | "danger";
  breakdown: Record<string, number>;
  voluntaryBonus: number;
}

export interface AttendanceAnalytics {
  total: number;
  statusCounts: Record<string, number>;
  excusedRatio: number;
  unexcusedRatio: number;
  voluntaryExtra: number;
  replacementServed: number;
  averageLateMinutes: number;
}

export interface TeamHeadAttendanceSummary {
  teams: Array<{
    id: string;
    month: number;
    year: number;
    serviceType: string;
    memberCount: number;
  }>;
  scopedMemberIds?: string[];
  pendingAbsences: AttendanceRecordItem[];
  pendingReplacements: unknown[];
  escalations: AttendanceRecordItem[];
}

export interface ChoirAttendanceSummary {
  totalMarked: number;
  excused: number;
  unexcused: number;
  repeatedLateness: number;
  pendingExcuseReview: number;
  recentRecords: AttendanceRecordItem[];
}

export interface MemberAttendanceHistory {
  score: AttendanceScore;
  records: AttendanceRecordItem[];
  trends: Array<{ month: string; present: number; absent: number; late: number }>;
  latenessCount: number;
  voluntaryServiceCount: number;
}

export interface DisciplineRecommendation {
  memberId: string;
  firstName: string;
  lastName: string;
  unexcusedCount: number;
  latenessCount: number;
  alertType: "unexcused_absence" | "repeated_lateness";
  recommendation: string;
}

export interface DisciplineRecommendationsResponse {
  count: number;
  items: DisciplineRecommendation[];
}

export interface CoordinatorAttendanceSummary {
  activeTeams: number;
  escalated: AttendanceRecordItem[];
  pendingReplacements: number;
  absentMembers: AttendanceRecordItem[];
  overloadAlerts: Array<{ memberId: string; assignmentCount: number }>;
  readinessWarnings: number;
}

export interface PresidentAttendanceSummary extends CoordinatorAttendanceSummary {
  attendanceTrend: Array<{ label: string; present: number; absent: number }>;
  disciplineRiskCount: number;
  voluntaryContributions: number;
}

export type SwapStatus =
  | "REQUESTED"
  | "TARGET_ACCEPTED"
  | "TARGET_REJECTED"
  | "LEADER_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "FINALIZED"
  | "CANCELLED";

export type ReplacementStatus =
  | "REQUESTED"
  | "LEADER_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "FINALIZED";

export type ReplacementKind = "VOLUNTARY" | "LEADER_ASSIGNED" | "EMERGENCY";

export type CoverageOperationalType =
  | "MUTUAL_SWAP"
  | "VOLUNTARY_REPLACEMENT"
  | "OFFICIAL_REPLACEMENT"
  | "EMERGENCY_REPLACEMENT";

export type ServiceReadinessStatus =
  | "FULLY_READY"
  | "REPLACEMENT_PENDING"
  | "ATTENDANCE_RISK"
  | "STAFFING_SHORTAGE"
  | "OPERATIONAL_DANGER";

export interface MemberSnapshot {
  id: string;
  firstName: string;
  lastName: string;
}

export interface SwapItem {
  id: string;
  eventId: string;
  requesterId: string;
  targetId: string;
  status: SwapStatus;
  coverageType: CoverageOperationalType;
  reason: string | null;
  escalated: boolean;
  voluntaryExtraService: boolean;
  countsOfficialQuota: boolean;
  createdAt: string;
  requester?: MemberSnapshot;
  target?: MemberSnapshot;
  event?: EventSnapshot;
}

export interface ReplacementItem {
  id: string;
  eventId: string;
  absentMemberId: string;
  coverMemberId: string | null;
  status: ReplacementStatus;
  kind: ReplacementKind;
  reason: string | null;
  selfFound: boolean;
  escalated: boolean;
  voluntaryExtraService: boolean;
  countsOfficialQuota: boolean;
  createdAt: string;
  absentMember?: MemberSnapshot;
  coverMember?: MemberSnapshot | null;
  event?: EventSnapshot;
}

export interface ServiceReadinessItem {
  eventId: string;
  eventTitle: string;
  startTime: string;
  status: ServiceReadinessStatus;
  assignedCount: number;
  minRequired: number;
  absenceCount: number;
  pendingReplacements: number;
  pendingSwaps: number;
  warnings: string[];
}

export interface FairnessAlert {
  memberId: string;
  firstName: string;
  lastName: string;
  assignmentCount: number;
  coverCount: number;
  alertType: "overload" | "dependency" | "imbalance";
  message: string;
}

export interface CoverageAnalytics {
  swapTotal: number;
  replacementTotal: number;
  voluntaryExtraService: number;
  unresolvedSwaps: number;
  fairnessAlerts: number;
  fairnessSummary: {
    overloaded: number;
    dependency: number;
    imbalance: number;
  };
}

export interface TeamHeadCoverageSummary {
  pendingSwaps: SwapItem[];
  pendingReplacements: ReplacementItem[];
  readiness: ServiceReadinessItem[];
  attendanceRisks: AttendanceRecordItem[];
}

export interface CoordinatorCoverageSummary {
  pendingSwaps: SwapItem[];
  pendingReplacements: ReplacementItem[];
  escalatedSwaps: SwapItem[];
  escalatedReplacements: ReplacementItem[];
  fairness: {
    alerts: FairnessAlert[];
    summary: CoverageAnalytics["fairnessSummary"];
  };
  readiness: ServiceReadinessItem[];
  staffingRisks: ServiceReadinessItem[];
  unresolvedSwapRate: number;
}

export interface CreateSwapInput {
  eventId: string;
  targetId: string;
  reason?: string;
  coverageType?: CoverageOperationalType;
}

export interface CreateReplacementInput {
  eventId: string;
  absentMemberId: string;
  coverMemberId?: string;
  selfFound?: boolean;
  reason?: string;
  notes?: string;
  kind?: ReplacementKind;
}
