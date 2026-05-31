-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'ALUMNI');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CHOIR_SERVICE', 'REHEARSAL', 'CONCERT', 'PROTOCOL_SERVICE', 'CHURCH_EVENT', 'SERVICE_1', 'SERVICE_2', 'TUESDAY', 'IGABURO');

-- CreateEnum
CREATE TYPE "MinistryScope" AS ENUM ('CHOIR', 'PROTOCOL', 'BOTH');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PhysicalStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

-- CreateEnum
CREATE TYPE "AttendanceOperationalStatus" AS ENUM ('ATTENDED', 'LATE', 'EXCUSED_ABSENCE', 'UNEXCUSED_ABSENCE', 'REPLACEMENT_SERVED', 'VOLUNTARY_EXTRA_SERVICE');

-- CreateEnum
CREATE TYPE "AttendanceReplacementType" AS ENUM ('OFFICIAL', 'LEADER_ASSIGNED', 'VOLUNTARY');

-- CreateEnum
CREATE TYPE "AttendanceEscalationLevel" AS ENUM ('TEAM_HEAD', 'COORDINATOR', 'PRESIDENT');

-- CreateEnum
CREATE TYPE "ReasonCategory" AS ENUM ('EXCUSED', 'UNEXCUSED');

-- CreateEnum
CREATE TYPE "SwapStatus" AS ENUM ('REQUESTED', 'TARGET_ACCEPTED', 'TARGET_REJECTED', 'LEADER_PENDING', 'APPROVED', 'REJECTED', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReplacementStatus" AS ENUM ('REQUESTED', 'LEADER_PENDING', 'APPROVED', 'REJECTED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "ReplacementKind" AS ENUM ('VOLUNTARY', 'LEADER_ASSIGNED', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "CoverageOperationalType" AS ENUM ('MUTUAL_SWAP', 'VOLUNTARY_REPLACEMENT', 'OFFICIAL_REPLACEMENT', 'EMERGENCY_REPLACEMENT');

-- CreateEnum
CREATE TYPE "CoverageApprovalLevel" AS ENUM ('MEMBER', 'TEAM_HEAD', 'COORDINATOR', 'PRESIDENT');

-- CreateEnum
CREATE TYPE "OperationalPriority" AS ENUM ('NORMAL', 'ELEVATED', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ServiceReadinessStatus" AS ENUM ('FULLY_READY', 'REPLACEMENT_PENDING', 'ATTENDANCE_RISK', 'STAFFING_SHORTAGE', 'OPERATIONAL_DANGER');

-- CreateEnum
CREATE TYPE "ProtocolTeamStatus" AS ENUM ('DRAFT', 'ACTIVE', 'FINALIZED');

-- CreateEnum
CREATE TYPE "DisciplineStage" AS ENUM ('REPORTED', 'UNDER_REVIEW', 'DECISION_PENDING', 'ACTIONED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "FinanceCategory" AS ENUM ('DUES', 'DONATION', 'UNIFORM', 'TRANSPORT', 'EVENT', 'PROJECT', 'CONCERT', 'OPERATIONAL_SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "DueStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "DueType" AS ENUM ('MONTHLY_DUES', 'UNIFORM', 'EVENT', 'PROJECT', 'CONCERT', 'OPERATIONAL_SUPPORT', 'SPECIAL_DRIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "FinanceApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BudgetKind" AS ENUM ('OPERATIONAL', 'EVENT', 'CONCERT', 'RECORDING', 'PROJECT', 'MONTHLY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EVENT_ASSIGNMENT', 'SCHEDULE_CHANGE', 'SWAP', 'ATTENDANCE', 'DISCIPLINE', 'GENERAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fcmToken" TEXT,
    "refreshTokenHash" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "preferredLanguage" TEXT NOT NULL DEFAULT 'rw',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "ministry" "MinistryScope" NOT NULL DEFAULT 'CHOIR',
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isChildrenChoir" BOOLEAN NOT NULL DEFAULT false,
    "serviceNumber" INTEGER,
    "clientUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "ministryScope" "MinistryScope" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "serviceSlot" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAssignment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" TEXT,
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "overrideById" TEXT,
    "countsOfficialQuota" BOOLEAN NOT NULL DEFAULT true,
    "voluntaryExtraService" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "physicalStatus" "PhysicalStatus" NOT NULL,
    "reasonCategory" "ReasonCategory",
    "reasonType" TEXT,
    "approvedById" TEXT,
    "notes" TEXT,
    "operationalStatus" "AttendanceOperationalStatus",
    "excuseReason" TEXT,
    "replacementType" "AttendanceReplacementType",
    "countsAsOfficial" BOOLEAN NOT NULL DEFAULT true,
    "voluntaryExtra" BOOLEAN NOT NULL DEFAULT false,
    "lateMinutes" INTEGER,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "escalationLevel" "AttendanceEscalationLevel",
    "escalationNotes" TEXT,
    "excuseEvidenceUrl" TEXT,
    "swapId" TEXT,
    "replacementId" TEXT,
    "lockedAt" TIMESTAMP(3),
    "clientUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Swap" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "SwapStatus" NOT NULL DEFAULT 'REQUESTED',
    "coverageType" "CoverageOperationalType" NOT NULL DEFAULT 'MUTUAL_SWAP',
    "reason" TEXT,
    "initiatedByUserId" TEXT,
    "approvalLevel" "CoverageApprovalLevel" NOT NULL DEFAULT 'TEAM_HEAD',
    "requiresLeader" BOOLEAN NOT NULL DEFAULT true,
    "leaderApprovedById" TEXT,
    "leaderNotes" TEXT,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "escalationReason" TEXT,
    "escalationLevel" "AttendanceEscalationLevel",
    "countsOfficialQuota" BOOLEAN NOT NULL DEFAULT true,
    "voluntaryExtraService" BOOLEAN NOT NULL DEFAULT false,
    "operationalPriority" "OperationalPriority" NOT NULL DEFAULT 'NORMAL',
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Swap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Replacement" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "absentMemberId" TEXT NOT NULL,
    "coverMemberId" TEXT,
    "status" "ReplacementStatus" NOT NULL DEFAULT 'REQUESTED',
    "selfFound" BOOLEAN NOT NULL DEFAULT false,
    "kind" "ReplacementKind" NOT NULL DEFAULT 'LEADER_ASSIGNED',
    "reason" TEXT,
    "initiatedByUserId" TEXT,
    "approvalLevel" "CoverageApprovalLevel" NOT NULL DEFAULT 'TEAM_HEAD',
    "countsOfficialQuota" BOOLEAN NOT NULL DEFAULT true,
    "voluntaryExtraService" BOOLEAN NOT NULL DEFAULT false,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "escalationReason" TEXT,
    "escalationLevel" "AttendanceEscalationLevel",
    "operationalPriority" "OperationalPriority" NOT NULL DEFAULT 'NORMAL',
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "approvedById" TEXT,
    "notes" TEXT,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Replacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoirCommitteeRole" (
    "id" TEXT NOT NULL,
    "choirId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissionsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoirCommitteeRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoirCommitteeMember" (
    "id" TEXT NOT NULL,
    "choirId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChoirCommitteeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolCommitteeRole" (
    "id" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissionsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProtocolCommitteeRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolCommitteeMember" (
    "id" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtocolCommitteeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolServiceTeam" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "serviceType" "EventType" NOT NULL,
    "teamHeadId" TEXT NOT NULL,
    "status" "ProtocolTeamStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProtocolServiceTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolServiceTeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignedByEngine" BOOLEAN NOT NULL DEFAULT true,
    "choirCompatible" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtocolServiceTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplineCase" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "reporterId" TEXT,
    "ministry" "MinistryScope" NOT NULL,
    "stage" "DisciplineStage" NOT NULL DEFAULT 'REPORTED',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "DisciplineCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceTransaction" (
    "id" TEXT NOT NULL,
    "ministryScope" "MinistryScope" NOT NULL DEFAULT 'CHOIR',
    "type" "TransactionType" NOT NULL,
    "category" "FinanceCategory" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "description" TEXT,
    "memberId" TEXT,
    "recordedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvalStatus" "FinanceApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "receiptUrl" TEXT,
    "relatedEventId" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "ministryScope" "MinistryScope" NOT NULL DEFAULT 'CHOIR',
    "name" TEXT NOT NULL,
    "kind" "BudgetKind" NOT NULL DEFAULT 'MONTHLY',
    "amount" DECIMAL(65,30) NOT NULL,
    "actualAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "relatedEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberDues" (
    "id" TEXT NOT NULL,
    "ministryScope" "MinistryScope" NOT NULL DEFAULT 'CHOIR',
    "memberId" TEXT NOT NULL,
    "dueType" "DueType" NOT NULL DEFAULT 'MONTHLY_DUES',
    "amount" DECIMAL(65,30) NOT NULL,
    "amountDue" DECIMAL(65,30),
    "amountPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "status" "DueStatus" NOT NULL DEFAULT 'UNPAID',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "recordedById" TEXT,
    "approvedById" TEXT,
    "waivedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberDues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncConflict" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "clientPayload" JSONB NOT NULL,
    "serverPayload" JSONB,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- CreateIndex
CREATE INDEX "Member_status_idx" ON "Member"("status");

-- CreateIndex
CREATE INDEX "Member_ministry_idx" ON "Member"("ministry");

-- CreateIndex
CREATE INDEX "Member_userId_idx" ON "Member"("userId");

-- CreateIndex
CREATE INDEX "Event_startTime_endTime_idx" ON "Event"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "Event_type_ministryScope_idx" ON "Event"("type", "ministryScope");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "EventAssignment_eventId_idx" ON "EventAssignment"("eventId");

-- CreateIndex
CREATE INDEX "EventAssignment_memberId_idx" ON "EventAssignment"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "EventAssignment_eventId_memberId_key" ON "EventAssignment"("eventId", "memberId");

-- CreateIndex
CREATE INDEX "Attendance_eventId_idx" ON "Attendance"("eventId");

-- CreateIndex
CREATE INDEX "Attendance_memberId_idx" ON "Attendance"("memberId");

-- CreateIndex
CREATE INDEX "Attendance_operationalStatus_idx" ON "Attendance"("operationalStatus");

-- CreateIndex
CREATE INDEX "Attendance_escalated_idx" ON "Attendance"("escalated");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_eventId_memberId_key" ON "Attendance"("eventId", "memberId");

-- CreateIndex
CREATE INDEX "Swap_eventId_idx" ON "Swap"("eventId");

-- CreateIndex
CREATE INDEX "Swap_requesterId_idx" ON "Swap"("requesterId");

-- CreateIndex
CREATE INDEX "Swap_targetId_idx" ON "Swap"("targetId");

-- CreateIndex
CREATE INDEX "Swap_status_idx" ON "Swap"("status");

-- CreateIndex
CREATE INDEX "Swap_escalated_idx" ON "Swap"("escalated");

-- CreateIndex
CREATE INDEX "Swap_approvalLevel_idx" ON "Swap"("approvalLevel");

-- CreateIndex
CREATE INDEX "Replacement_eventId_idx" ON "Replacement"("eventId");

-- CreateIndex
CREATE INDEX "Replacement_absentMemberId_idx" ON "Replacement"("absentMemberId");

-- CreateIndex
CREATE INDEX "Replacement_status_idx" ON "Replacement"("status");

-- CreateIndex
CREATE INDEX "Replacement_escalated_idx" ON "Replacement"("escalated");

-- CreateIndex
CREATE INDEX "Replacement_approvalLevel_idx" ON "Replacement"("approvalLevel");

-- CreateIndex
CREATE INDEX "ChoirCommitteeRole_choirId_idx" ON "ChoirCommitteeRole"("choirId");

-- CreateIndex
CREATE UNIQUE INDEX "ChoirCommitteeRole_choirId_name_key" ON "ChoirCommitteeRole"("choirId", "name");

-- CreateIndex
CREATE INDEX "ChoirCommitteeMember_choirId_idx" ON "ChoirCommitteeMember"("choirId");

-- CreateIndex
CREATE INDEX "ChoirCommitteeMember_memberId_idx" ON "ChoirCommitteeMember"("memberId");

-- CreateIndex
CREATE INDEX "ChoirCommitteeMember_roleId_idx" ON "ChoirCommitteeMember"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "ChoirCommitteeMember_choirId_memberId_roleId_key" ON "ChoirCommitteeMember"("choirId", "memberId", "roleId");

-- CreateIndex
CREATE INDEX "ProtocolCommitteeRole_ministryId_idx" ON "ProtocolCommitteeRole"("ministryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolCommitteeRole_ministryId_name_key" ON "ProtocolCommitteeRole"("ministryId", "name");

-- CreateIndex
CREATE INDEX "ProtocolCommitteeMember_ministryId_idx" ON "ProtocolCommitteeMember"("ministryId");

-- CreateIndex
CREATE INDEX "ProtocolCommitteeMember_memberId_idx" ON "ProtocolCommitteeMember"("memberId");

-- CreateIndex
CREATE INDEX "ProtocolCommitteeMember_roleId_idx" ON "ProtocolCommitteeMember"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolCommitteeMember_ministryId_memberId_roleId_key" ON "ProtocolCommitteeMember"("ministryId", "memberId", "roleId");

-- CreateIndex
CREATE INDEX "ProtocolServiceTeam_month_year_idx" ON "ProtocolServiceTeam"("month", "year");

-- CreateIndex
CREATE INDEX "ProtocolServiceTeam_serviceType_idx" ON "ProtocolServiceTeam"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolServiceTeam_month_year_serviceType_teamHeadId_key" ON "ProtocolServiceTeam"("month", "year", "serviceType", "teamHeadId");

-- CreateIndex
CREATE INDEX "ProtocolServiceTeamMember_teamId_idx" ON "ProtocolServiceTeamMember"("teamId");

-- CreateIndex
CREATE INDEX "ProtocolServiceTeamMember_memberId_idx" ON "ProtocolServiceTeamMember"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolServiceTeamMember_teamId_memberId_key" ON "ProtocolServiceTeamMember"("teamId", "memberId");

-- CreateIndex
CREATE INDEX "DisciplineCase_memberId_idx" ON "DisciplineCase"("memberId");

-- CreateIndex
CREATE INDEX "DisciplineCase_stage_idx" ON "DisciplineCase"("stage");

-- CreateIndex
CREATE INDEX "DisciplineCase_ministry_idx" ON "DisciplineCase"("ministry");

-- CreateIndex
CREATE INDEX "FinanceTransaction_ministryScope_idx" ON "FinanceTransaction"("ministryScope");

-- CreateIndex
CREATE INDEX "FinanceTransaction_type_idx" ON "FinanceTransaction"("type");

-- CreateIndex
CREATE INDEX "FinanceTransaction_transactionDate_idx" ON "FinanceTransaction"("transactionDate");

-- CreateIndex
CREATE INDEX "FinanceTransaction_memberId_idx" ON "FinanceTransaction"("memberId");

-- CreateIndex
CREATE INDEX "FinanceTransaction_relatedEventId_idx" ON "FinanceTransaction"("relatedEventId");

-- CreateIndex
CREATE INDEX "FinanceTransaction_approvalStatus_idx" ON "FinanceTransaction"("approvalStatus");

-- CreateIndex
CREATE INDEX "Budget_ministryScope_idx" ON "Budget"("ministryScope");

-- CreateIndex
CREATE INDEX "Budget_periodStart_periodEnd_idx" ON "Budget"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "Budget_relatedEventId_idx" ON "Budget"("relatedEventId");

-- CreateIndex
CREATE INDEX "MemberDues_memberId_idx" ON "MemberDues"("memberId");

-- CreateIndex
CREATE INDEX "MemberDues_ministryScope_idx" ON "MemberDues"("ministryScope");

-- CreateIndex
CREATE INDEX "MemberDues_status_idx" ON "MemberDues"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MemberDues_memberId_period_ministryScope_dueType_key" ON "MemberDues"("memberId", "period", "ministryScope", "dueType");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SyncConflict_userId_idx" ON "SyncConflict"("userId");

-- CreateIndex
CREATE INDEX "SyncConflict_createdAt_idx" ON "SyncConflict"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAssignment" ADD CONSTRAINT "EventAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAssignment" ADD CONSTRAINT "EventAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swap" ADD CONSTRAINT "Swap_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swap" ADD CONSTRAINT "Swap_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swap" ADD CONSTRAINT "Swap_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Replacement" ADD CONSTRAINT "Replacement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Replacement" ADD CONSTRAINT "Replacement_absentMemberId_fkey" FOREIGN KEY ("absentMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Replacement" ADD CONSTRAINT "Replacement_coverMemberId_fkey" FOREIGN KEY ("coverMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoirCommitteeMember" ADD CONSTRAINT "ChoirCommitteeMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ChoirCommitteeRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoirCommitteeMember" ADD CONSTRAINT "ChoirCommitteeMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolCommitteeMember" ADD CONSTRAINT "ProtocolCommitteeMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ProtocolCommitteeRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolCommitteeMember" ADD CONSTRAINT "ProtocolCommitteeMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolServiceTeam" ADD CONSTRAINT "ProtocolServiceTeam_teamHeadId_fkey" FOREIGN KEY ("teamHeadId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolServiceTeamMember" ADD CONSTRAINT "ProtocolServiceTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ProtocolServiceTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolServiceTeamMember" ADD CONSTRAINT "ProtocolServiceTeamMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplineCase" ADD CONSTRAINT "DisciplineCase_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplineCase" ADD CONSTRAINT "DisciplineCase_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDues" ADD CONSTRAINT "MemberDues_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
