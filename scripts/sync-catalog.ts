import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { extractEntryTheme, isAllowedImageHost } from '@kindstyle/shared'
import { createProvider } from '../workers/src/providers'

const prisma = new PrismaClient()

const API_KEY = process.env.FORTNITE_API_KEY
const API_BASE = 'https://fortnite-api.com'

interface BannerApiItem {
  id: string
  devName: string
  name: string
  description: string | null
  category: string | null
  images?: { smallIcon?: string; icon?: string }
}

interface BannerColorApiItem {
  id: string
  color: string
  category: string | null
  subCategoryGroup: number | null
}

async function syncCatalog() {
  console.log('[Sync] Starting catalog sync...')

  const provider = createProvider()
  console.log(`[Sync] Using provider: ${provider.name} v${provider.version}`)

  const result = await provider.fetchShop()

  if (!result.success || !result.data) {
    throw new Error(`Provider fetch failed: ${result.error?.message}`)
  }

  const normalizedShop = result.data
  const checksum = normalizedShop.checksum

  console.log(`[Sync] Shop fetched. Checksum: ${checksum.substring(0, 8)}...`)
  console.log(`[Sync] Entries count: ${normalizedShop.entries.length}`)

  const now = new Date()

  const snapshot = await prisma.shopSnapshot.create({
    data: {
      provider: normalizedShop.provider,
      fetched_at: now,
      shop_date: new Date(normalizedShop.shopDate),
      raw_payload: normalizedShop as any,
      checksum,
    },
  })

  console.log(`[Sync] Snapshot created: ${snapshot.id}`)

  let productCount = 0
  let itemCount = 0

  for (const entry of normalizedShop.entries) {
    const slug = `${entry.slug}-${entry.fortniteProductId}`

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: entry.name,
        description: entry.description,
        image_url: entry.imageUrl,
        icon_url: entry.iconUrl,
        featured_image_url: entry.featuredImageUrl,
        last_seen_at: now,
      },
      create: {
        internal_sku: `FORT-${entry.fortniteProductId}`,
        fortnite_product_id: entry.fortniteProductId,
        name: entry.name,
        slug,
        description: entry.description,
        type: entry.type as any,
        rarity: entry.rarity as any,
        series: entry.series,
        price_vbucks: entry.priceVbucks,
        image_url: entry.imageUrl,
        icon_url: entry.iconUrl,
        featured_image_url: entry.featuredImageUrl,
        giftable: entry.giftable as any,
        active: true,
        visible: true,
        first_seen_at: now,
        last_seen_at: now,
      },
    })

    productCount++

    await prisma.shopItem.create({
      data: {
        shop_snapshot_id: snapshot.id,
        product_id: product.id,
        price_vbucks: entry.priceVbucks,
        display_order: itemCount,
        section: entry.section,
        layout_id: entry.layoutId,
        offer_id: entry.offerId,
        bundle_info: entry.bundleInfo || undefined,
        featured: itemCount < 5,
      },
    })

    itemCount++
  }

  console.log(`[Sync] ${productCount} products synced`)
  console.log(`[Sync] ${itemCount} shop items created`)
  console.log('[Sync] Done!')
}

async function fetchBannerReferenceJson<T>(pathname: string): Promise<T> {
  const response = await fetch(`${API_BASE}${pathname}`, {
    method: 'GET',
    headers: {
      'Authorization': API_KEY!,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return (await response.json()) as T
}

async function syncBanners() {
  console.log('[Sync] Syncing banner reference data...')

  const banners = await fetchBannerReferenceJson<{ status: number; data: BannerApiItem[] }>('/v1/banners?language=es')
  const colors = await fetchBannerReferenceJson<{ status: number; data: BannerColorApiItem[] }>('/v1/banners/colors')

  const syncedAt = new Date()
  const CHUNK_SIZE = 50

  for (let i = 0; i < banners.data.length; i += CHUNK_SIZE) {
    const chunk = banners.data.slice(i, i + CHUNK_SIZE)
    await Promise.all(
      chunk.map((banner) =>
        prisma.fortniteBanner.upsert({
          where: { id: banner.id },
          update: {
            dev_name: banner.devName || null,
            name: banner.name,
            category: banner.category || null,
            small_icon_url: isAllowedImageHost(banner.images?.smallIcon) ? banner.images.smallIcon : null,
            icon_url: isAllowedImageHost(banner.images?.icon) ? banner.images.icon : null,
            synced_at: syncedAt,
          },
          create: {
            id: banner.id,
            dev_name: banner.devName || null,
            name: banner.name,
            category: banner.category || null,
            small_icon_url: isAllowedImageHost(banner.images?.smallIcon) ? banner.images.smallIcon : null,
            icon_url: isAllowedImageHost(banner.images?.icon) ? banner.images.icon : null,
            synced_at: syncedAt,
          },
        })
      )
    )
  }

  for (let i = 0; i < colors.data.length; i += CHUNK_SIZE) {
    const chunk = colors.data.slice(i, i + CHUNK_SIZE)
    await Promise.all(
      chunk.map((color) =>
        prisma.fortniteBannerColor.upsert({
          where: { id: color.id },
          update: {
            color: color.color,
            category: color.category || null,
            sub_category_group: color.subCategoryGroup ?? null,
            synced_at: syncedAt,
          },
          create: {
            id: color.id,
            color: color.color,
            category: color.category || null,
            sub_category_group: color.subCategoryGroup ?? null,
            synced_at: syncedAt,
          },
        })
      )
    )
  }

  console.log(`[Sync] ${banners.data.length} banners and ${colors.data.length} banner colors upserted`)
}

async function main() {
  await syncCatalog()

  if (process.argv.includes('--with-banners')) {
    await syncBanners()
  }
}

main()
  .catch((e) => {
    console.error('[Sync] Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })