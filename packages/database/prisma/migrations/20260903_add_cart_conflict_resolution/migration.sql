-- CreateEnum
CREATE TYPE "CartConflictResolutionStatus" AS ENUM ('PENDING', 'KEPT_SEPARATE', 'REPLACED_BY_BUNDLE', 'INVALIDATED');

-- CreateTable
CREATE TABLE "CartConflictResolution" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bundle_offer_id" TEXT NOT NULL,
    "bundle_name" TEXT NOT NULL,
    "bundle_price_vbucks" INTEGER NOT NULL,
    "bundle_components" JSONB NOT NULL,
    "conflicting_items" JSONB NOT NULL,
    "status" "CartConflictResolutionStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartConflictResolution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartConflictResolution_user_id_status_idx" ON "CartConflictResolution"("user_id", "status");

-- CreateIndex
CREATE INDEX "CartConflictResolution_expires_at_idx" ON "CartConflictResolution"("expires_at");

-- AddForeignKey
ALTER TABLE "CartConflictResolution" ADD CONSTRAINT "CartConflictResolution_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
