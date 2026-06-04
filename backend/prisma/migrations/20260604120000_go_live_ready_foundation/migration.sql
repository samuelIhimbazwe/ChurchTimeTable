-- GO-LIVE-READY-1: delivery logs, reminder runs, event reminders, e2e flag

-- Redefine NotificationRuleTrigger (SQLite: recreate via Prisma migrate)
-- Prisma will handle enum extension on PostgreSQL; for SQLite dev, migrate dev applies.

CREATE TABLE "NotificationDeliveryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationId" TEXT,
    "recipientUserId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dedupeKey" TEXT,
    "sentAt" DATETIME,
    "readAt" DATETIME,
    "failureReason" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationDeliveryLog_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "NotificationDeliveryLog_dedupeKey_key" ON "NotificationDeliveryLog"("dedupeKey");
CREATE INDEX "NotificationDeliveryLog_recipientUserId_idx" ON "NotificationDeliveryLog"("recipientUserId");
CREATE INDEX "NotificationDeliveryLog_trigger_idx" ON "NotificationDeliveryLog"("trigger");
CREATE INDEX "NotificationDeliveryLog_status_idx" ON "NotificationDeliveryLog"("status");
CREATE INDEX "NotificationDeliveryLog_createdAt_idx" ON "NotificationDeliveryLog"("createdAt");

CREATE TABLE "ReminderJobRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobKey" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "failureMessage" TEXT,
    "lastRunAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextRunAt" DATETIME,
    "metadata" TEXT
);

CREATE INDEX "ReminderJobRun_jobKey_idx" ON "ReminderJobRun"("jobKey");
CREATE INDEX "ReminderJobRun_lastRunAt_idx" ON "ReminderJobRun"("lastRunAt");

ALTER TABLE "ChurchConfiguration" ADD COLUMN "goLiveE2eVerified" BOOLEAN NOT NULL DEFAULT false;
