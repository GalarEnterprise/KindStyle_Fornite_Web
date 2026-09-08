-- AlterEnum
ALTER TYPE "CartItemType" ADD VALUE 'ACCOUNT_ACCESS';

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN "account_access" JSONB;
