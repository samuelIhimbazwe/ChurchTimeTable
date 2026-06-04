-- MF-5 Ministry Finance & Resource Funds Foundation

CREATE TYPE "MinistryFundType" AS ENUM ('GENERAL', 'WELFARE', 'PROJECT', 'EVENT', 'EMERGENCY', 'CUSTOM');
CREATE TYPE "MinistryBudgetStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');
CREATE TYPE "MinistryExpenseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'VOID');
CREATE TYPE "MinistryFundTransactionType" AS ENUM ('DEPOSIT', 'EXPENSE', 'TRANSFER', 'ADJUSTMENT');

ALTER TABLE "MinistrySettings" ADD COLUMN "allowFinance" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "MinistryFund" (
    "id" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "MinistryFundType" NOT NULL DEFAULT 'GENERAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MinistryFund_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MinistryFund_ministryId_name_key" ON "MinistryFund"("ministryId", "name");
CREATE INDEX "MinistryFund_ministryId_isActive_idx" ON "MinistryFund"("ministryId", "isActive");
CREATE INDEX "MinistryFund_type_idx" ON "MinistryFund"("type");

CREATE TABLE "MinistryBudget" (
    "id" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "totalBudget" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "status" "MinistryBudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MinistryBudget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MinistryBudget_ministryId_name_fiscalYear_key" ON "MinistryBudget"("ministryId", "name", "fiscalYear");
CREATE INDEX "MinistryBudget_ministryId_status_idx" ON "MinistryBudget"("ministryId", "status");
CREATE INDEX "MinistryBudget_fiscalYear_idx" ON "MinistryBudget"("fiscalYear");

CREATE TABLE "MinistryBudgetCategory" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allocatedAmount" DECIMAL(65,30) NOT NULL,
    "spentAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MinistryBudgetCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MinistryBudgetCategory_budgetId_name_key" ON "MinistryBudgetCategory"("budgetId", "name");
CREATE INDEX "MinistryBudgetCategory_budgetId_idx" ON "MinistryBudgetCategory"("budgetId");

CREATE TABLE "MinistryExpense" (
    "id" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "categoryId" TEXT,
    "budgetId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "receiptUrls" JSONB,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MinistryExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MinistryExpense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MinistryExpense_ministryId_status_idx" ON "MinistryExpense"("ministryId", "status");
CREATE INDEX "MinistryExpense_fundId_idx" ON "MinistryExpense"("fundId");
CREATE INDEX "MinistryExpense_expenseDate_idx" ON "MinistryExpense"("expenseDate");

CREATE TABLE "MinistryFundTransfer" (
    "id" TEXT NOT NULL,
    "fromFundId" TEXT NOT NULL,
    "toFundId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MinistryFundTransfer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MinistryFundTransfer_fromFundId_idx" ON "MinistryFundTransfer"("fromFundId");
CREATE INDEX "MinistryFundTransfer_toFundId_idx" ON "MinistryFundTransfer"("toFundId");
CREATE INDEX "MinistryFundTransfer_createdAt_idx" ON "MinistryFundTransfer"("createdAt");

CREATE TABLE "MinistryFundTransaction" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "type" "MinistryFundTransactionType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "actorId" TEXT,
    "transferId" TEXT,
    "expenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MinistryFundTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MinistryFundTransaction_fundId_createdAt_idx" ON "MinistryFundTransaction"("fundId", "createdAt");
CREATE INDEX "MinistryFundTransaction_type_idx" ON "MinistryFundTransaction"("type");

ALTER TABLE "MinistryFund" ADD CONSTRAINT "MinistryFund_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryBudget" ADD CONSTRAINT "MinistryBudget_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryBudgetCategory" ADD CONSTRAINT "MinistryBudgetCategory_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "MinistryBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryExpense" ADD CONSTRAINT "MinistryExpense_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryExpense" ADD CONSTRAINT "MinistryExpense_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "MinistryFund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MinistryExpense" ADD CONSTRAINT "MinistryExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MinistryBudgetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MinistryExpense" ADD CONSTRAINT "MinistryExpense_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "MinistryBudget"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MinistryExpense" ADD CONSTRAINT "MinistryExpense_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MinistryExpense" ADD CONSTRAINT "MinistryExpense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MinistryFundTransfer" ADD CONSTRAINT "MinistryFundTransfer_fromFundId_fkey" FOREIGN KEY ("fromFundId") REFERENCES "MinistryFund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MinistryFundTransfer" ADD CONSTRAINT "MinistryFundTransfer_toFundId_fkey" FOREIGN KEY ("toFundId") REFERENCES "MinistryFund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MinistryFundTransfer" ADD CONSTRAINT "MinistryFundTransfer_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MinistryFundTransaction" ADD CONSTRAINT "MinistryFundTransaction_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "MinistryFund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryFundTransaction" ADD CONSTRAINT "MinistryFundTransaction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MinistryFundTransaction" ADD CONSTRAINT "MinistryFundTransaction_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "MinistryFundTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
