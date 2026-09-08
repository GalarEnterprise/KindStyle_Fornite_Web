-- AlterTable: Add missing columns to ShopItem (layout_id and theme already exist from init)
ALTER TABLE "ShopItem" ADD COLUMN "offer_id" TEXT;
ALTER TABLE "ShopItem" ADD COLUMN "bundle_info" JSONB;

-- CreateIndex
CREATE INDEX "ShopItem_offer_id_idx" ON "ShopItem"("offer_id");
