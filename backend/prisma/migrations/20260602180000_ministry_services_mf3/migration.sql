-- MF-3 Ministry Services Platform

-- Devotion visibility extension
CREATE TABLE "new_Devotion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "choirId" TEXT,
    "ministryId" TEXT,
    "operationalUnitId" TEXT,
    "visibilityScope" TEXT NOT NULL DEFAULT 'CHOIR',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "verseReference" TEXT,
    "verseText" TEXT,
    "type" TEXT NOT NULL,
    "isPinned" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Devotion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Devotion_choirId_fkey" FOREIGN KEY ("choirId") REFERENCES "Choir" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Devotion_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Devotion_operationalUnitId_fkey" FOREIGN KEY ("operationalUnitId") REFERENCES "OperationalUnit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Devotion" SELECT "id", "choirId", NULL, NULL, 'CHOIR', "title", "content", "verseReference", "verseText", "type", "isPinned", "publishedAt", "expiresAt", "createdById", "createdAt", "updatedAt" FROM "Devotion";
DROP TABLE "Devotion";
ALTER TABLE "new_Devotion" RENAME TO "Devotion";
CREATE INDEX "Devotion_choirId_isPinned_idx" ON "Devotion"("choirId", "isPinned");
CREATE INDEX "Devotion_choirId_type_idx" ON "Devotion"("choirId", "type");
CREATE INDEX "Devotion_choirId_publishedAt_idx" ON "Devotion"("choirId", "publishedAt");
CREATE INDEX "Devotion_ministryId_publishedAt_idx" ON "Devotion"("ministryId", "publishedAt");
CREATE INDEX "Devotion_operationalUnitId_idx" ON "Devotion"("operationalUnitId");
CREATE INDEX "Devotion_visibilityScope_idx" ON "Devotion"("visibilityScope");

-- Notification ministry scope
ALTER TABLE "Notification" ADD COLUMN "ministryId" TEXT REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Notification_userId_ministryId_idx" ON "Notification"("userId", "ministryId");

-- Ministry announcements
CREATE TABLE "MinistryAnnouncement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "audienceType" TEXT NOT NULL DEFAULT 'ALL_MINISTRY',
    "audienceRef" TEXT,
    "publishedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdByUserId" TEXT NOT NULL,
    "isPinned" INTEGER NOT NULL DEFAULT 0,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id")
);
CREATE INDEX "MinistryAnnouncement_ministryId_isActive_idx" ON "MinistryAnnouncement"("ministryId", "isActive");
CREATE INDEX "MinistryAnnouncement_ministryId_isPinned_idx" ON "MinistryAnnouncement"("ministryId", "isPinned");
CREATE INDEX "MinistryAnnouncement_ministryId_publishedAt_idx" ON "MinistryAnnouncement"("ministryId", "publishedAt");

CREATE TABLE "MinistryAnnouncementRead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "announcementId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("announcementId") REFERENCES "MinistryAnnouncement" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "MinistryAnnouncementRead_announcementId_memberId_key" ON "MinistryAnnouncementRead"("announcementId", "memberId");

CREATE TABLE "MinistryDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "currentVersionId" TEXT UNIQUE,
    "isArchived" INTEGER NOT NULL DEFAULT 0,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id")
);
CREATE INDEX "MinistryDocument_ministryId_isArchived_idx" ON "MinistryDocument"("ministryId", "isArchived");

CREATE TABLE "MinistryDocumentVersion" (
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
    FOREIGN KEY ("documentId") REFERENCES "MinistryDocument" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id")
);
CREATE UNIQUE INDEX "MinistryDocumentVersion_documentId_versionNumber_key" ON "MinistryDocumentVersion"("documentId", "versionNumber");

CREATE TABLE "MinistryMeeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id")
);
CREATE INDEX "MinistryMeeting_ministryId_status_idx" ON "MinistryMeeting"("ministryId", "status");
CREATE INDEX "MinistryMeeting_ministryId_scheduledAt_idx" ON "MinistryMeeting"("ministryId", "scheduledAt");

CREATE TABLE "MinistryMeetingAttendee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "present" INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY ("meetingId") REFERENCES "MinistryMeeting" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "MinistryMeetingAttendee_meetingId_memberId_key" ON "MinistryMeetingAttendee"("meetingId", "memberId");

CREATE TABLE "MinistryMeetingDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("meetingId") REFERENCES "MinistryMeeting" ("id") ON DELETE CASCADE
);

CREATE TABLE "MinistryMeetingActionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assigneeId" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("meetingId") REFERENCES "MinistryMeeting" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("assigneeId") REFERENCES "Member" ("id")
);
CREATE INDEX "MinistryMeetingActionItem_meetingId_status_idx" ON "MinistryMeetingActionItem"("meetingId", "status");

CREATE TABLE "MinistryActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ministryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorLabel" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "summary" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ministryId") REFERENCES "Ministry" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("actorUserId") REFERENCES "User" ("id")
);
CREATE INDEX "MinistryActivity_ministryId_createdAt_idx" ON "MinistryActivity"("ministryId", "createdAt");
CREATE INDEX "MinistryActivity_ministryId_type_idx" ON "MinistryActivity"("ministryId", "type");
