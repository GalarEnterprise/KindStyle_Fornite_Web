-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('EPIC', 'XBOX', 'PLAYSTATION');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('OUTFIT', 'BACK_BLING', 'PICKAXE', 'GLIDER', 'EMOTE', 'WRAP', 'MUSIC_PACK', 'LOADING_SCREEN', 'SPRAY', 'CONTRAIL', 'TOY', 'BANNER', 'VBucks', 'BATTLE_PASS', 'CREW', 'BUNDLE', 'OTHER');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'EXOTIC', 'ICON_SERIES', 'STAR_WARS', 'DC', 'MARVEL', 'GAMING_LEGENDS', 'LAVA', 'FROZEN', 'SHADOW', 'SLURP', 'DARK', 'BRIGHT', 'BEYOND');

-- CreateEnum
CREATE TYPE "GiftabilityStatus" AS ENUM ('GIFTABLE', 'NOT_GIFTABLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CartItemType" AS ENUM ('GIFT', 'VBucks', 'CREW', 'BATTLE_PASS');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('CREATED', 'WHATSAPP_OPENED', 'CONTACTED', 'UNDER_REVIEW', 'PRICE_CONFIRMED', 'PAYMENT_PENDING', 'PAID', 'FULFILLMENT_PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER', 'OXXO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_RECEIPT', 'VALIDATION_IN_PROGRESS', 'VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BotStatus" AS ENUM ('ACTIVE', 'COOLDOWN', 'LIMITED', 'UNAVAILABLE', 'DISABLED', 'ERROR');

-- CreateEnum
CREATE TYPE "FriendshipRequestStatus" AS ENUM ('CREATED', 'PROCESSING', 'WAITING_ACCEPTANCE', 'PARTIALLY_READY', 'READY', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BotRequestStatus" AS ENUM ('PENDING', 'REQUEST_SENT');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nickname" TEXT,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "phone" TEXT,
    "platform" "Platform",
    "platform_user_id" TEXT,
    "display_name" TEXT,
    "preferred_currency" TEXT NOT NULL DEFAULT 'MXN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FortniteAccount" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platform_user_id" TEXT NOT NULL,
    "display_name" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FortniteAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "internal_sku" TEXT NOT NULL,
    "fortnite_product_id" TEXT NOT NULL,
    "fortnite_offer_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProductType" NOT NULL,
    "subcategory" TEXT,
    "rarity" "Rarity",
    "series" TEXT,
    "price_vbucks" INTEGER NOT NULL,
    "image_url" TEXT,
    "icon_url" TEXT,
    "featured_image_url" TEXT,
    "banner_url" TEXT,
    "giftable" "GiftabilityStatus" NOT NULL DEFAULT 'UNKNOWN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "admin_price_mxn" DECIMAL(10,2),
    "first_seen_at" TIMESTAMP(3),
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSnapshot" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "shop_date" TIMESTAMP(3) NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "checksum" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "shop_snapshot_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "price_vbucks" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "section" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "type" "CartItemType" NOT NULL,
    "encrypted_credentials" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'CREATED',
    "channel" TEXT,
    "message" TEXT,
    "total_vbucks" INTEGER NOT NULL DEFAULT 0,
    "total_mxn" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "whatsapp_opened_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestItem" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "product_name_snapshot" TEXT NOT NULL,
    "fortnite_product_id" TEXT NOT NULL,
    "fortnite_offer_id" TEXT,
    "price_vbucks_snapshot" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "fulfillment_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "receipt_file_url" TEXT,
    "receipt_file_name" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING_RECEIPT',
    "admin_notes" TEXT,
    "validated_by" TEXT,
    "validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FulfillmentAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'EPIC',
    "status" "BotStatus" NOT NULL DEFAULT 'ACTIVE',
    "capacity" INTEGER NOT NULL DEFAULT 1000,
    "daily_limit" INTEGER NOT NULL DEFAULT 50,
    "current_usage" INTEGER NOT NULL DEFAULT 0,
    "external_identifier" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FulfillmentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendshipRequest" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platform_user_id" TEXT NOT NULL,
    "status" "FriendshipRequestStatus" NOT NULL DEFAULT 'CREATED',
    "required_bots" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendshipRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendshipRequestBot" (
    "id" TEXT NOT NULL,
    "friendship_request_id" TEXT NOT NULL,
    "fulfillment_account_id" TEXT NOT NULL,
    "request_status" "BotRequestStatus" NOT NULL DEFAULT 'PENDING',
    "friendship_status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "request_sent_at" TIMESTAMP(3),
    "friendship_confirmed_at" TIMESTAMP(3),
    "eligibility_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendshipRequestBot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "web_enabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL,
    "rate_to_mxn" DECIMAL(12,6) NOT NULL,
    "source" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencySetting" (
    "id" TEXT NOT NULL,
    "default_currency" TEXT NOT NULL DEFAULT 'MXN',
    "vbucks_rate_mxn" DECIMAL(10,4) NOT NULL DEFAULT 7.5,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "user_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_nickname_idx" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refresh_token_key" ON "Session"("refresh_token");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "VerificationCode_email_idx" ON "VerificationCode"("email");

-- CreateIndex
CREATE INDEX "VerificationCode_code_idx" ON "VerificationCode"("code");

-- CreateIndex
CREATE INDEX "FortniteAccount_user_id_idx" ON "FortniteAccount"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "FortniteAccount_user_id_platform_key" ON "FortniteAccount"("user_id", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "Product_internal_sku_key" ON "Product"("internal_sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_fortnite_product_id_idx" ON "Product"("fortnite_product_id");

-- CreateIndex
CREATE INDEX "Product_type_idx" ON "Product"("type");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_active_visible_idx" ON "Product"("active", "visible");

-- CreateIndex
CREATE INDEX "ShopSnapshot_fetched_at_idx" ON "ShopSnapshot"("fetched_at");

-- CreateIndex
CREATE INDEX "ShopSnapshot_shop_date_idx" ON "ShopSnapshot"("shop_date");

-- CreateIndex
CREATE INDEX "ShopItem_shop_snapshot_id_idx" ON "ShopItem"("shop_snapshot_id");

-- CreateIndex
CREATE INDEX "ShopItem_product_id_idx" ON "ShopItem"("product_id");

-- CreateIndex
CREATE INDEX "CartItem_user_id_idx" ON "CartItem"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_user_id_product_id_key" ON "CartItem"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "Request_request_number_key" ON "Request"("request_number");

-- CreateIndex
CREATE INDEX "Request_user_id_idx" ON "Request"("user_id");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "Request_request_number_idx" ON "Request"("request_number");

-- CreateIndex
CREATE INDEX "Request_created_at_idx" ON "Request"("created_at");

-- CreateIndex
CREATE INDEX "RequestItem_request_id_idx" ON "RequestItem"("request_id");

-- CreateIndex
CREATE INDEX "Payment_request_id_idx" ON "Payment"("request_id");

-- CreateIndex
CREATE INDEX "Payment_user_id_idx" ON "Payment"("user_id");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "FulfillmentAccount_status_idx" ON "FulfillmentAccount"("status");

-- CreateIndex
CREATE INDEX "FulfillmentAccount_platform_idx" ON "FulfillmentAccount"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "FriendshipRequest_request_id_key" ON "FriendshipRequest"("request_id");

-- CreateIndex
CREATE INDEX "FriendshipRequest_user_id_idx" ON "FriendshipRequest"("user_id");

-- CreateIndex
CREATE INDEX "FriendshipRequest_status_idx" ON "FriendshipRequest"("status");

-- CreateIndex
CREATE INDEX "FriendshipRequest_request_id_idx" ON "FriendshipRequest"("request_id");

-- CreateIndex
CREATE INDEX "FriendshipRequestBot_friendship_request_id_idx" ON "FriendshipRequestBot"("friendship_request_id");

-- CreateIndex
CREATE INDEX "FriendshipRequestBot_fulfillment_account_id_idx" ON "FriendshipRequestBot"("fulfillment_account_id");

-- CreateIndex
CREATE INDEX "FriendshipRequestBot_friendship_status_idx" ON "FriendshipRequestBot"("friendship_status");

-- CreateIndex
CREATE INDEX "FriendshipRequestBot_eligibility_at_idx" ON "FriendshipRequestBot"("eligibility_at");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "Notification_read_at_idx" ON "Notification"("read_at");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_user_id_key" ON "NotificationPreference"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_currency_code_key" ON "ExchangeRate"("currency_code");

-- CreateIndex
CREATE INDEX "EventLog_entity_entity_id_idx" ON "EventLog"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "EventLog_event_type_idx" ON "EventLog"("event_type");

-- CreateIndex
CREATE INDEX "EventLog_created_at_idx" ON "EventLog"("created_at");

-- CreateIndex
CREATE INDEX "AuditLog_admin_id_idx" ON "AuditLog"("admin_id");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entity_id_idx" ON "AuditLog"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FortniteAccount" ADD CONSTRAINT "FortniteAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopItem" ADD CONSTRAINT "ShopItem_shop_snapshot_id_fkey" FOREIGN KEY ("shop_snapshot_id") REFERENCES "ShopSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopItem" ADD CONSTRAINT "ShopItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestItem" ADD CONSTRAINT "RequestItem_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestItem" ADD CONSTRAINT "RequestItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendshipRequest" ADD CONSTRAINT "FriendshipRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendshipRequestBot" ADD CONSTRAINT "FriendshipRequestBot_friendship_request_id_fkey" FOREIGN KEY ("friendship_request_id") REFERENCES "FriendshipRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendshipRequestBot" ADD CONSTRAINT "FriendshipRequestBot_fulfillment_account_id_fkey" FOREIGN KEY ("fulfillment_account_id") REFERENCES "FulfillmentAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
