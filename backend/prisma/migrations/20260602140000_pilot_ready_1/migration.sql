-- PILOT-READY-1: imports, notification rules, notification archive

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Notification_userId_archived_idx" ON "Notification"("userId", "archived");

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT,
    "mimeType" TEXT,
    "uploadedById" TEXT NOT NULL,
    "preview" JSON,
    "results" JSON,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "ImportJob_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");
CREATE INDEX "ImportJob_type_idx" ON "ImportJob"("type");
CREATE INDEX "ImportJob_uploadedById_idx" ON "ImportJob"("uploadedById");

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trigger" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "titleTemplate" TEXT,
    "bodyTemplate" TEXT,
    "config" JSON,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "NotificationRule_trigger_key" ON "NotificationRule"("trigger");
