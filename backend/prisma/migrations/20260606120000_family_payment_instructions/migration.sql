-- Family-level MoMo / bank payment instructions for contribution claims
ALTER TABLE "Family" ADD COLUMN IF NOT EXISTS "paymentMomoNumber" TEXT;
ALTER TABLE "Family" ADD COLUMN IF NOT EXISTS "paymentMomoAccountName" TEXT;
ALTER TABLE "Family" ADD COLUMN IF NOT EXISTS "paymentBankAccount" TEXT;
ALTER TABLE "Family" ADD COLUMN IF NOT EXISTS "paymentBankName" TEXT;
ALTER TABLE "Family" ADD COLUMN IF NOT EXISTS "paymentInstructions" TEXT;
