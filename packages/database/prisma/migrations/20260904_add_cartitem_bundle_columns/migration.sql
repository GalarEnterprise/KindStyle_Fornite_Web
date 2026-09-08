-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN "bundle_offer_id" TEXT,
ADD COLUMN "bundle_name" TEXT,
ADD COLUMN "bundle_price_vbucks" INTEGER,
ADD COLUMN "bundle_components" JSONB;

-- CreateIndex
CREATE INDEX "CartItem_bundle_offer_id_idx" ON "CartItem"("bundle_offer_id");
