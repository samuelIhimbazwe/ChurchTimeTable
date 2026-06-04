-- MF-7 Local Church Operations & Scheduling

CREATE TABLE "OperationTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" INTEGER NOT NULL DEFAULT 0,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "OperationTemplate_code_key" ON "OperationTemplate"("code");
CREATE INDEX "OperationTemplate_type_isActive_idx" ON "OperationTemplate"("type", "isActive");

CREATE TABLE "TemplateAssignmentRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "assignmentType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "required" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    CONSTRAINT "TemplateAssignmentRequirement_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OperationTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "TemplateAssignmentRequirement_templateId_idx" ON "TemplateAssignmentRequirement"("templateId");

CREATE TABLE "OperationOccurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "publishedAt" DATETIME,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperationOccurrence_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OperationTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OperationOccurrence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationOccurrence_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "OperationOccurrence_status_idx" ON "OperationOccurrence"("status");
CREATE INDEX "OperationOccurrence_startAt_endAt_idx" ON "OperationOccurrence"("startAt", "endAt");
CREATE INDEX "OperationOccurrence_type_idx" ON "OperationOccurrence"("type");
CREATE INDEX "OperationOccurrence_templateId_idx" ON "OperationOccurrence"("templateId");

CREATE TABLE "AssignmentRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationOccurrenceId" TEXT NOT NULL,
    "assignmentType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "required" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    CONSTRAINT "AssignmentRequirement_operationOccurrenceId_fkey" FOREIGN KEY ("operationOccurrenceId") REFERENCES "OperationOccurrence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AssignmentRequirement_operationOccurrenceId_idx" ON "AssignmentRequirement"("operationOccurrenceId");

CREATE TABLE "OperationAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "occurrenceId" TEXT NOT NULL,
    "assignmentType" TEXT NOT NULL,
    "operationalUnitId" TEXT NOT NULL,
    "memberId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmedAt" DATETIME,
    "declinedAt" DATETIME,
    "notes" TEXT,
    "overrideReason" TEXT,
    "overrideByUserId" TEXT,
    "attendanceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperationAssignment_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "OperationOccurrence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OperationAssignment_operationalUnitId_fkey" FOREIGN KEY ("operationalUnitId") REFERENCES "OperationalUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OperationAssignment_occurrenceId_operationalUnitId_key" ON "OperationAssignment"("occurrenceId", "operationalUnitId");
CREATE INDEX "OperationAssignment_occurrenceId_status_idx" ON "OperationAssignment"("occurrenceId", "status");
CREATE INDEX "OperationAssignment_operationalUnitId_idx" ON "OperationAssignment"("operationalUnitId");
CREATE INDEX "OperationAssignment_memberId_idx" ON "OperationAssignment"("memberId");
CREATE INDEX "OperationAssignment_attendanceId_idx" ON "OperationAssignment"("attendanceId");

CREATE TABLE "OperationNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "occurrenceId" TEXT,
    "assignmentId" TEXT,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "scheduledFor" DATETIME,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationNotification_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "OperationOccurrence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OperationNotification_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "OperationAssignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OperationNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "OperationNotification_userId_sentAt_idx" ON "OperationNotification"("userId", "sentAt");
CREATE INDEX "OperationNotification_scheduledFor_idx" ON "OperationNotification"("scheduledFor");
CREATE INDEX "OperationNotification_occurrenceId_idx" ON "OperationNotification"("occurrenceId");
