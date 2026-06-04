-- DEPLOYMENT-READY-1: church configuration store
CREATE TABLE "ChurchConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "setupStep" INTEGER NOT NULL DEFAULT 0,
    "churchInfo" TEXT,
    "leadership" TEXT,
    "ministriesConfig" TEXT,
    "choirsConfig" TEXT,
    "protocolConfig" TEXT,
    "servicesConfig" TEXT,
    "serviceTimes" TEXT,
    "choirRules" TEXT,
    "protocolRules" TEXT,
    "schedulingRules" TEXT,
    "notificationRules" TEXT,
    "attendanceRules" TEXT,
    "demoModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
