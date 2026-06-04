-- Choir MVP foundation migration
-- Remaps legacy MemberStatus values to expanded lifecycle enum

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "memberNumber" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "ministry" TEXT NOT NULL DEFAULT 'CHOIR',
    "status" TEXT NOT NULL DEFAULT 'NEW_MEMBER',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isChildrenChoir" BOOLEAN NOT NULL DEFAULT false,
    "serviceNumber" INTEGER,
    "clientUpdatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Member" (
    "id", "userId", "memberNumber", "firstName", "lastName", "phone", "ministry",
    "status", "onboardingCompleted", "isChildrenChoir", "serviceNumber",
    "clientUpdatedAt", "createdAt", "updatedAt"
)
SELECT
    "id", "userId", "memberNumber", "firstName", "lastName", "phone", "ministry",
    CASE "status"
        WHEN 'PENDING' THEN 'NEW_MEMBER'
        WHEN 'INACTIVE' THEN 'TEMPORARILY_INACTIVE'
        WHEN 'ALUMNI' THEN 'GRADUATED'
        ELSE "status"
    END,
    "onboardingCompleted", "isChildrenChoir", "serviceNumber",
    "clientUpdatedAt", "createdAt", "updatedAt"
FROM "Member";

DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";

CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");
CREATE UNIQUE INDEX "Member_memberNumber_key" ON "Member"("memberNumber");
CREATE INDEX "Member_status_idx" ON "Member"("status");
CREATE INDEX "Member_ministry_idx" ON "Member"("ministry");
CREATE INDEX "Member_userId_idx" ON "Member"("userId");

PRAGMA foreign_keys=ON;

-- Member profile & lifecycle
CREATE TABLE "MemberProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "dateOfBirth" DATETIME,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "baptismDate" DATETIME,
    "choirJoinDate" DATETIME,
    "notes" TEXT,
    "skillsJson" TEXT,
    "instrumentsJson" TEXT,
    "availabilityJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MemberProfile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MemberProfile_memberId_key" ON "MemberProfile"("memberId");

CREATE TABLE "MemberStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "changedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemberStatusHistory_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "MemberStatusHistory_memberId_idx" ON "MemberStatusHistory"("memberId");
CREATE INDEX "MemberStatusHistory_createdAt_idx" ON "MemberStatusHistory"("createdAt");

-- Welfare
CREATE TABLE "WelfareCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "WelfareCategory_code_key" ON "WelfareCategory"("code");

CREATE TABLE "WelfareCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "familyId" TEXT,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "coordinatorId" TEXT,
    "supportPlan" TEXT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WelfareCase_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WelfareCase_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WelfareCase_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "WelfareCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "WelfareCase_memberId_idx" ON "WelfareCase"("memberId");
CREATE INDEX "WelfareCase_familyId_idx" ON "WelfareCase"("familyId");
CREATE INDEX "WelfareCase_status_idx" ON "WelfareCase"("status");
CREATE INDEX "WelfareCase_categoryId_idx" ON "WelfareCase"("categoryId");

CREATE TABLE "WelfareContribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT,
    "contributorId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "paymentChannel" TEXT,
    "paymentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "recordedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WelfareContribution_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "WelfareCase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WelfareContribution_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "WelfareContribution_caseId_idx" ON "WelfareContribution"("caseId");
CREATE INDEX "WelfareContribution_contributorId_idx" ON "WelfareContribution"("contributorId");
CREATE INDEX "WelfareContribution_paymentAt_idx" ON "WelfareContribution"("paymentAt");

CREATE TABLE "WelfareAssistance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "assistanceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL,
    "currency" TEXT DEFAULT 'RWF',
    "deliveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WelfareAssistance_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "WelfareCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "WelfareAssistance_caseId_idx" ON "WelfareAssistance"("caseId");
CREATE INDEX "WelfareAssistance_deliveredAt_idx" ON "WelfareAssistance"("deliveredAt");

-- Music
CREATE TABLE "SongCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "SongCategory_code_key" ON "SongCategory"("code");

CREATE TABLE "Song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "language" TEXT,
    "composer" TEXT,
    "source" TEXT,
    "scriptureReference" TEXT,
    "categoryId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Song_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SongCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Song_title_idx" ON "Song"("title");
CREATE INDEX "Song_categoryId_idx" ON "Song"("categoryId");

CREATE TABLE "SongAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "songId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SongAsset_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SongAsset_songId_idx" ON "SongAsset"("songId");

CREATE TABLE "SongUsageRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "songId" TEXT NOT NULL,
    "eventId" TEXT,
    "rehearsalPlanId" TEXT,
    "leaderId" TEXT,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "SongUsageRecord_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SongUsageRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SongUsageRecord_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "SongUsageRecord_songId_idx" ON "SongUsageRecord"("songId");
CREATE INDEX "SongUsageRecord_usedAt_idx" ON "SongUsageRecord"("usedAt");

CREATE TABLE "VoiceSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX "VoiceSection_code_key" ON "VoiceSection"("code");

CREATE TABLE "RehearsalPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "leaderId" TEXT,
    "objectives" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RehearsalPlan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RehearsalPlan_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RehearsalPlan_eventId_key" ON "RehearsalPlan"("eventId");
CREATE INDEX "RehearsalPlan_leaderId_idx" ON "RehearsalPlan"("leaderId");

CREATE TABLE "RehearsalPlanSong" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rehearsalPlanId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    CONSTRAINT "RehearsalPlanSong_rehearsalPlanId_fkey" FOREIGN KEY ("rehearsalPlanId") REFERENCES "RehearsalPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RehearsalPlanSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RehearsalPlanSong_rehearsalPlanId_songId_key" ON "RehearsalPlanSong"("rehearsalPlanId", "songId");

CREATE TABLE "RehearsalPlanSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rehearsalPlanId" TEXT NOT NULL,
    "voiceSectionId" TEXT NOT NULL,
    "focusNotes" TEXT,
    CONSTRAINT "RehearsalPlanSection_rehearsalPlanId_fkey" FOREIGN KEY ("rehearsalPlanId") REFERENCES "RehearsalPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RehearsalPlanSection_voiceSectionId_fkey" FOREIGN KEY ("voiceSectionId") REFERENCES "VoiceSection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RehearsalPlanSection_rehearsalPlanId_voiceSectionId_key" ON "RehearsalPlanSection"("rehearsalPlanId", "voiceSectionId");

-- Announcements
CREATE TABLE "ChoirAnnouncement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'ENTIRE_CHOIR',
    "audienceRef" TEXT,
    "publishedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "ChoirAnnouncement_publishedAt_idx" ON "ChoirAnnouncement"("publishedAt");
CREATE INDEX "ChoirAnnouncement_audience_idx" ON "ChoirAnnouncement"("audience");

CREATE TABLE "ChoirAnnouncementRead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ChoirAnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "ChoirAnnouncement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChoirAnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ChoirAnnouncementRead_announcementId_userId_key" ON "ChoirAnnouncementRead"("announcementId", "userId");

-- Documents
CREATE TABLE "ChoirDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "currentVersionId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ChoirDocumentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "changeNotes" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChoirDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ChoirDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ChoirDocumentVersion_documentId_versionNumber_key" ON "ChoirDocumentVersion"("documentId", "versionNumber");
CREATE INDEX "ChoirDocumentVersion_documentId_idx" ON "ChoirDocumentVersion"("documentId");

-- Meetings
CREATE TABLE "ChoirMeeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "location" TEXT,
    "agenda" TEXT,
    "minutes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "MeetingAttendee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "MeetingAttendee_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "ChoirMeeting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MeetingAttendee_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MeetingAttendee_meetingId_memberId_key" ON "MeetingAttendee"("meetingId", "memberId");

CREATE TABLE "MeetingDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeetingDecision_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "ChoirMeeting" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "MeetingDecision_meetingId_idx" ON "MeetingDecision"("meetingId");

CREATE TABLE "MeetingActionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ownerId" TEXT,
    "dueAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "MeetingActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "ChoirMeeting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MeetingActionItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "MeetingActionItem_meetingId_idx" ON "MeetingActionItem"("meetingId");
CREATE INDEX "MeetingActionItem_status_idx" ON "MeetingActionItem"("status");

-- Uniforms
CREATE TABLE "UniformType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT
);
CREATE UNIQUE INDEX "UniformType_code_key" ON "UniformType"("code");

CREATE TABLE "UniformItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniformTypeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "size" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "condition" TEXT,
    CONSTRAINT "UniformItem_uniformTypeId_fkey" FOREIGN KEY ("uniformTypeId") REFERENCES "UniformType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "UniformItem_uniformTypeId_idx" ON "UniformItem"("uniformTypeId");
CREATE INDEX "UniformItem_status_idx" ON "UniformItem"("status");

CREATE TABLE "UniformAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniformItemId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "UniformAssignment_uniformItemId_fkey" FOREIGN KEY ("uniformItemId") REFERENCES "UniformItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UniformAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "UniformAssignment_memberId_idx" ON "UniformAssignment"("memberId");
CREATE INDEX "UniformAssignment_uniformItemId_idx" ON "UniformAssignment"("uniformItemId");

-- Equipment
CREATE TABLE "EquipmentAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "serialNumber" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "EquipmentAsset_serialNumber_key" ON "EquipmentAsset"("serialNumber");

CREATE TABLE "EquipmentAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "memberId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "EquipmentAssignment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "EquipmentAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EquipmentAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "EquipmentAssignment_equipmentId_idx" ON "EquipmentAssignment"("equipmentId");
CREATE INDEX "EquipmentAssignment_memberId_idx" ON "EquipmentAssignment"("memberId");

CREATE TABLE "EquipmentMaintenanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquipmentMaintenanceLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "EquipmentAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "EquipmentMaintenanceLog_equipmentId_idx" ON "EquipmentMaintenanceLog"("equipmentId");
