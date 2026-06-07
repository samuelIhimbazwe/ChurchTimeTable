// ── Enums ──────────────────────────────────────────────

export type MinistryScope = 'CHOIR' | 'PROTOCOL' | 'BOTH' | 'NONE'
export type MemberStatus  = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export type OccurrenceStatus =
  | 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED'
  | 'COMPLETED' | 'CANCELLED'

export type ChurchOperationType = 'SERVICE' | 'SPECIAL_EVENT'

export type OperationAssignmentType =
  | 'MAIN_CHOIR' | 'CHILDREN_CHOIR' | 'PROTOCOL_TEAM'
  | 'SERVICE_TEAM' | 'CUSTOM'

export type ChoirActivityType =
  | 'SERVICE' | 'REHEARSAL' | 'PRAYER' | 'SPECIAL_REHEARSAL'
  | 'CONCERT' | 'RETREAT' | 'TRAINING' | 'MEETING' | 'OTHER'

export type ChoirAttendanceOutcome =
  | 'PRESENT_FULL' | 'PRESENT_LATE' | 'PRESENT_LEFT_EARLY'
  | 'PRESENT_LATE_LEFT_EARLY' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED'

export type ProtocolAttendanceOutcome =
  | 'PRESENT_FULL' | 'PRESENT_LEFT_EARLY' | 'PRESENT_LATE'
  | 'PRESENT_LATE_LEFT_EARLY' | 'ABSENT_EXCUSED'
  | 'ABSENT_SELF_REPLACED' | 'ABSENT_UNEXCUSED'

export type ProtocolTeamStatus =
  | 'GENERATED' | 'REVIEWED' | 'APPROVED' | 'PUBLISHED' | 'COMPLETED'

export type ProtocolMemberType = 'OFFICIAL' | 'REPLACEMENT' | 'VOLUNTEER'

export type ReplacementRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type JoinRequestStatus =
  | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFO' | 'WITHDRAWN'

export type DisciplineStage =
  | 'STAGE_1' | 'STAGE_2' | 'STAGE_3' | 'STAGE_4' | 'STAGE_5'

export type ScoreBand = 'excellent' | 'good' | 'danger'

// ── Core entities ──────────────────────────────────────

export interface AuthUser {
  id:                  string
  email:               string
  name:                string
  role:                string
  permissions:         string[]
  onboardingComplete:  boolean
  ministryScope?:      MinistryScope
}

export interface Member {
  id:             string
  name:           string
  email:          string
  phone?:         string
  avatarUrl?:     string
  ministry:       MinistryScope
  status:         MemberStatus
  attendanceRate?: number
  score?:         number
  scoreBand?:     ScoreBand
  memberSince:    string
  choirId?:       string
  choirName?:     string
}

export interface Paginated<T> {
  items:      T[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

// ── OperationOccurrence (replaces Event) ───────────────

export interface OperationOccurrence {
  id:             string
  title:          string
  templateCode?:  string
  type:           ChurchOperationType
  status:         OccurrenceStatus
  date:           string           // ISO date "2025-06-08"
  startTime?:     string
  endTime?:       string
  location?:      string
  ministryId?:    string
  notes?:         string
  assignments?:   OperationAssignment[]
}

export interface OperationAssignment {
  id:             string
  occurrenceId:   string
  assignmentType: OperationAssignmentType
  unitId:         string
  unitName?:      string
  quantity:       number
  filled:         number
}

// ── ChoirActivity (replaces Event for choir) ───────────

export interface ChoirActivity {
  id:            string
  choirId:       string
  choirName?:    string
  activityType:  ChoirActivityType
  title:         string
  date:          string
  startTime?:    string
  endTime?:      string
  location?:     string
  occurrenceId?: string
  attendanceOpen: boolean
  attendanceCount?: number
  memberCount?:    number
}

// ── Attendance ─────────────────────────────────────────

export interface ChoirAttendanceRecord {
  id:           string
  activityId:   string
  memberId:     string
  memberName:   string
  outcome:      ChoirAttendanceOutcome
  scoreEarned:  number
  note?:        string
  recordedAt:   string
}

export interface ProtocolAttendanceRecord {
  id:            string
  teamMemberId:  string
  memberId:      string
  memberName:    string
  outcome:       ProtocolAttendanceOutcome
  scoreEarned:   number
  note?:         string
  recordedAt?:   string
}

// ── Protocol ───────────────────────────────────────────

export interface ProtocolOccurrenceTeam {
  id:            string
  occurrenceId:  string
  status:        ProtocolTeamStatus
  members:       ProtocolTeamMember[]
  leaders:       ProtocolTeamLeader[]
  backupCount:   number
  createdAt:     string
}

export interface ProtocolTeamMember {
  id:         string
  memberId:   string
  memberName: string
  choirName?: string
  type:       ProtocolMemberType
  attended?:  ProtocolAttendanceOutcome
}

export interface ProtocolTeamLeader {
  id:              string
  memberId:        string
  memberName:      string
  choirId?:        string
  isNonChoirLeader: boolean
}

export interface ProtocolReplacementRequest {
  id:          string
  requesterId: string
  requesterName: string
  occurrenceId: string
  occurrenceTitle: string
  reason:      string
  status:      ReplacementRequestStatus
  createdAt:   string
}

export interface ProtocolRankingEntry {
  rank:           number
  memberId:       string
  memberName:     string
  score:          number
  attendanceRate: number
  serviceCount:   number
  badges:         string[]
}

// ── Choir ──────────────────────────────────────────────

export interface Choir {
  id:                string
  name:              string
  code:              string
  kind:              'PRIMARY' | 'SPECIAL' | 'CHILDREN'
  memberCount:       number
  isPublicJoinable:  boolean
  presidentName?:    string
  attendanceRate?:   number
  nextActivityDate?: string
}

export interface ChoirMemberPosition {
  roleId:   string
  roleName: string
}

export interface ChoirMember {
  id:            string
  memberId:      string
  name:          string
  voicePart?:    string
  attendanceRate: number
  score:         number
  scoreBand:     ScoreBand
  duesPaid:      boolean
  status:        'ACTIVE' | 'INACTIVE'
  positions?:    ChoirMemberPosition[]
}

export interface ChoirJoinRequest {
  id:        string
  choirId:   string
  choirName?: string
  memberId:  string
  status:    JoinRequestStatus
  message?:  string
  reason?:   string | null
  requestType?: string
  reviewNotes?: string | null
  createdAt: string
}

// ── Contributions ──────────────────────────────────────

export interface Contribution {
  id:          string
  memberId:    string
  amount:      number
  currency:    string
  type:        string
  month:       string
  note?:       string
  receiptUrl?: string
  submittedAt: string
  approvedAt?: string
  status:      'PENDING' | 'APPROVED' | 'REJECTED'
}

// ── Families ───────────────────────────────────────────

export interface Family {
  id:          string
  name:        string
  headName:    string
  memberCount: number
  totalContributions: number
  rank?:       number
}

// ── Discipline ─────────────────────────────────────────

export interface DisciplineCase {
  id:          string
  memberId:    string
  memberName:  string
  stage:       DisciplineStage
  description: string
  openedAt:    string
  updatedAt:   string
  resolvedAt?: string
}

// ── Welfare ────────────────────────────────────────────

export interface WelfareCase {
  id:          string
  memberId:    string
  memberName:  string
  type:        string
  description: string
  status:      'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  createdAt:   string
}

// ── Notifications ──────────────────────────────────────

export interface ApiNotification {
  id:        string
  title:     string
  body:      string
  type:      'info' | 'success' | 'warning' | 'error'
  read:      boolean
  link?:     string
  createdAt: string
}

// ── Dashboard summaries ────────────────────────────────

export interface MemberDashboardSummary {
  nextOccurrence?:   OperationOccurrence
  nextActivity?:     ChoirActivity
  myAttendanceRate:  number
  myScore:           number
  myScoreBand:       ScoreBand
  myRank?:           number
  pendingSwapOffers: number
  unreadNotifications: number
  recentActivities:  ChoirActivity[]
  upcomingSchedule:  ScheduleItem[]
}

export interface ScheduleItem {
  id:        string
  title:     string
  date:      string
  time?:     string
  type:      string
  role?:     string
  source:    'CHOIR' | 'PROTOCOL' | 'OPERATION'
}

export interface LeaderDashboardSummary {
  pendingSwaps:       number
  pendingApprovals:   number
  attendanceRate:     number
  attendanceDelta:    number
  totalMembers:       number
  membersDelta:       number
  activeWelfare:      number
  eventsThisWeek:     number
  ministryHealth:     { name: string; percentage: number }[]
  actionItems:        ActionItem[]
  upcomingOccurrences: OperationOccurrence[]
}

export interface ActionItem {
  id:    string
  type:  'warning' | 'info' | 'danger'
  text:  string
  link?: string
}

export interface AdminDashboardSummary extends LeaderDashboardSummary {
  pendingMembers:   number
  syncConflicts:    number
  systemHealth:     'healthy' | 'warning' | 'critical'
  dataQualityScore: number
}
