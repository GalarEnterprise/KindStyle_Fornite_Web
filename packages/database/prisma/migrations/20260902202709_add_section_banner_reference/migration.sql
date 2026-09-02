-- AlterTable
ALTER TABLE "ShopItem" ADD COLUMN     "layout_id" TEXT,
ADD COLUMN     "theme" JSONB;

-- CreateTable
CREATE TABLE "fortnite_banners" (
    "id" TEXT NOT NULL,
    "dev_name" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "small_icon_url" TEXT,
    "icon_url" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fortnite_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fortnite_banner_colors" (
    "id" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "category" TEXT,
    "sub_category_group" INTEGER,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fortnite_banner_colors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fortnite_banners_category_idx" ON "fortnite_banners"("category");

-- CreateIndex
CREATE INDEX "ShopItem_layout_id_idx" ON "ShopItem"("layout_id");

