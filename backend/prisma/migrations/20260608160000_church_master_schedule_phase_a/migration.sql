-- Church Master Schedule Phase A: facility catalog

CREATE TABLE "ChurchFacility" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "building" TEXT,
    "floor" TEXT,
    "capacity" INTEGER,
    "requiresAdminNotify" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChurchFacility_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChurchFacility_code_key" ON "ChurchFacility"("code");
CREATE INDEX "ChurchFacility_isActive_sortOrder_idx" ON "ChurchFacility"("isActive", "sortOrder");
