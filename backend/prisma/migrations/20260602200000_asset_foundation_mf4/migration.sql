-- MF-4 Resource & Asset Management Foundation

CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'IN_USE', 'UNDER_MAINTENANCE', 'LOST', 'DAMAGED', 'RETIRED');
CREATE TYPE "AssetCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'BROKEN');
CREATE TYPE "AssetOwnerType" AS ENUM ('CHURCH', 'MINISTRY', 'OPERATIONAL_UNIT');
CREATE TYPE "AssetAssignmentTargetType" AS ENUM ('MINISTRY', 'OPERATIONAL_UNIT', 'MEMBER');
CREATE TYPE "AssetMaintenanceType" AS ENUM ('REPAIR', 'SERVICE', 'INSPECTION', 'UPGRADE');
CREATE TYPE "AssetActivityType" AS ENUM ('CREATED', 'OWNERSHIP_CHANGED', 'CUSTODIAN_ASSIGNED', 'ASSIGNED', 'RETURNED', 'TRANSFERRED', 'MAINTENANCE_RECORDED', 'LOST', 'FOUND', 'RETIRED');
CREATE TYPE "UniformAssetStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'IN_STORAGE', 'DAMAGED', 'RETIRED');

CREATE TABLE "AssetCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssetCategory_code_key" ON "AssetCategory"("code");
CREATE INDEX "AssetCategory_isSystem_idx" ON "AssetCategory"("isSystem");

CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "condition" "AssetCondition" NOT NULL DEFAULT 'GOOD',
    "purchaseDate" TIMESTAMP(3),
    "purchaseValue" DECIMAL(65,30),
    "serialNumber" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "imageUrls" JSONB,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Asset_code_key" ON "Asset"("code");
CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId");
CREATE INDEX "Asset_status_idx" ON "Asset"("status");
CREATE INDEX "Asset_condition_idx" ON "Asset"("condition");

CREATE TABLE "AssetOwnership" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "ownerType" "AssetOwnerType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownershipPercentage" DECIMAL(65,30),
    "contributedAmount" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetOwnership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssetOwnership_assetId_ownerType_ownerId_key" ON "AssetOwnership"("assetId", "ownerType", "ownerId");
CREATE INDEX "AssetOwnership_ownerType_ownerId_idx" ON "AssetOwnership"("ownerType", "ownerId");
CREATE INDEX "AssetOwnership_assetId_idx" ON "AssetOwnership"("assetId");

CREATE TABLE "AssetCustodian" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "notes" TEXT,
    CONSTRAINT "AssetCustodian_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssetCustodian_assetId_releasedAt_idx" ON "AssetCustodian"("assetId", "releasedAt");
CREATE INDEX "AssetCustodian_memberId_idx" ON "AssetCustodian"("memberId");

CREATE TABLE "AssetAssignment" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assignedToType" "AssetAssignmentTargetType" NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "purpose" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "notes" TEXT,
    CONSTRAINT "AssetAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssetAssignment_assetId_returnedAt_idx" ON "AssetAssignment"("assetId", "returnedAt");
CREATE INDEX "AssetAssignment_assignedToType_assignedToId_idx" ON "AssetAssignment"("assignedToType", "assignedToId");

CREATE TABLE "AssetMaintenance" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "AssetMaintenanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(65,30),
    "vendor" TEXT,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextMaintenanceDate" TIMESTAMP(3),
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssetMaintenance_assetId_performedAt_idx" ON "AssetMaintenance"("assetId", "performedAt");
CREATE INDEX "AssetMaintenance_nextMaintenanceDate_idx" ON "AssetMaintenance"("nextMaintenanceDate");

CREATE TABLE "AssetActivity" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "activityType" "AssetActivityType" NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssetActivity_assetId_createdAt_idx" ON "AssetActivity"("assetId", "createdAt");
CREATE INDEX "AssetActivity_activityType_idx" ON "AssetActivity"("activityType");

CREATE TABLE "UniformProfile" (
    "assetId" TEXT NOT NULL,
    "size" TEXT,
    "gender" "MemberGender",
    "style" TEXT,
    "color" TEXT,
    "status" "UniformAssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT "UniformProfile_pkey" PRIMARY KEY ("assetId")
);

CREATE TABLE "InstrumentProfile" (
    "assetId" TEXT NOT NULL,
    "instrumentType" TEXT NOT NULL,
    "tuningNotes" TEXT,
    "maintenanceIntervalDays" INTEGER,
    CONSTRAINT "InstrumentProfile_pkey" PRIMARY KEY ("assetId")
);

CREATE INDEX "InstrumentProfile_instrumentType_idx" ON "InstrumentProfile"("instrumentType");

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssetOwnership" ADD CONSTRAINT "AssetOwnership_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetCustodian" ADD CONSTRAINT "AssetCustodian_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetCustodian" ADD CONSTRAINT "AssetCustodian_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetActivity" ADD CONSTRAINT "AssetActivity_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetActivity" ADD CONSTRAINT "AssetActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UniformProfile" ADD CONSTRAINT "UniformProfile_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstrumentProfile" ADD CONSTRAINT "InstrumentProfile_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
