-- CreateEnum
CREATE TYPE "VerificationCodeType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "verification_codes" ADD COLUMN "type" "VerificationCodeType" NOT NULL DEFAULT 'EMAIL_VERIFICATION';

-- CreateIndex
CREATE INDEX "verification_codes_email_type_idx" ON "verification_codes"("email", "type");
