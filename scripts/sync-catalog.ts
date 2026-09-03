import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { extractEntryTheme, isAllowedImageHost } from '@kindstyle/shared'

const prisma = new PrismaClient()

const API_KEY = process.env.FORTNITE_API_KEY
const API_BASE = 'https://fortnite-api.com'

interface BrItem {
  id: string
  name: string
  description: string
  type: { value: string; displayValue: string; backendValue: string }
  rarity: { value: string; displayValue: string; backendValue: string } | null
  series: { value: string; image: string; colors: string[]; backendValue: string } | null
  images: {
    smallIcon: string
    icon: string
    featured: string | null
  }
}

interface FortniteShopEntry {
  regularPrice: number
  finalPrice: number
  devName: string
  offerId: string
  giftable: boolean
  refundable: boolean
  colors?: Record<string, string | undefined> | null
  layout?: { id: string; name: string }
  bundle?: { name: string; info: string; image: string }
  brItems?: BrItem[]
  tracks?: unknown[]
  newDisplayAsset?: {
    id: string
    materialInstances?: Array<{ images: Record<string, string> }>
    renderImages?: Array<{ image?: string } | null>
  }
}

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

interface FortniteShopResponse {
  status: number
  data: {
    hash: string
    date: string
    entries: FortniteShopEntry[]
  }
}

function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function mapProductType(type: string): string {
  const typeMap: Record<string, string> = {
    'outfit': 'OUTFIT',
    'backpack': 'BACK_BLING',
    'back bling': 'BACK_BLING',
    'pickaxe': 'PICKAXE',
    'glider': 'GLIDER',
    'emote': 'EMOTE',
    'wrap': 'WRAP',
    'musicpack': 'MUSIC_PACK',
    'music pack': 'MUSIC_PACK',
    'loadingscreen': 'LOADING_SCREEN',
    'loading screen': 'LOADING_SCREEN',
    'spray': 'SPRAY',
    'contrail': 'CONTRAIL',
    'toy': 'TOY',
    'banner': 'BANNER',
    'bundle': 'BUNDLE',
  }
  return typeMap[type.toLowerCase()] || 'OTHER'
}

function mapRarity(rarity: string): string {
  const rarityMap: Record<string, string> = {
    'common': 'COMMON',
    'uncommon': 'UNCOMMON',
    'rare': 'RARE',
    'epic': 'EPIC',
    'legendary': 'LEGENDARY',
    'mythic': 'MYTHIC',
    'exotic': 'EXOTIC',
    'icon': 'ICON_SERIES',
    'icon series': 'ICON_SERIES',
    'star wars': 'STAR_WARS',
    'starwars': 'STAR_WARS',
    'dc': 'EPIC', // Map DC series to EPIC
    'marvel': 'EPIC', // Map Marvel series to EPIC
    'shadow': 'EPIC',
    'slurp': 'RARE',
    'frozen': 'RARE',
    'burnt': 'UNCOMMON',
    'alkemic': 'UNCOMMON',
  }
  return rarityMap[rarity.toLowerCase()] || 'COMMON'
}

async function fetchShop(): Promise<FortniteShopResponse> {
  const url = new URL('/v2/shop', API_BASE)
  url.searchParams.set('language', 'es')

  console.log(`[Sync] Fetching shop from ${url.toString()}`)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': API_KEY!,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()

  if (data.status !== 200) {
    throw new Error(`API returned status ${data.status}`)
  }

  return data
}

async function syncCatalog() {
  console.log('[Sync] Starting catalog sync...')

  if (!API_KEY) {
    throw new Error('FORTNITE_API_KEY environment variable is not set')
  }

  const shopData = await fetchShop()

  console.log(`[Sync] Shop fetched. Hash: ${shopData.data.hash}`)
  console.log(`[Sync] Entries count: ${shopData.data.entries.length}`)

  const now = new Date()
  const checksum = createHash('sha256')
    .update(JSON.stringify(shopData.data))
    .digest('hex')

  // Create snapshot
  const snapshot = await prisma.shopSnapshot.create({
    data: {
      provider: 'fortnite-api',
      fetched_at: now,
      shop_date: now,
      raw_payload: shopData.data as any,
      checksum,
    },
  })

  console.log(`[Sync] Snapshot created: ${snapshot.id}`)

  let productCount = 0
  let itemCount = 0
  const seenLooseItemIds = new Set<string>()
  const seenBundleItemKeys = new Set<string>()

  for (const entry of shopData.data.entries) {
    // Only process entries with brItems (Battle Royale items)
    if (!entry.brItems || entry.brItems.length === 0) {
      continue
    }

    const isBundle = entry.brItems.length > 1 || Boolean(entry.bundle)

    for (const item of entry.brItems) {
      if (isBundle) {
        const bundleKey = `${entry.offerId ?? 'no-offer'}|${item.id}`
        if (seenBundleItemKeys.has(bundleKey)) continue
        seenBundleItemKeys.add(bundleKey)
      } else {
        if (seenLooseItemIds.has(item.id)) continue
        seenLooseItemIds.add(item.id)
      }

      const slug = `${normalizeSlug(item.name)}-${item.id}`

      // Upsert product
      const product = await prisma.product.upsert({
        where: { slug },
        update: {
          name: item.name,
          description: item.description,
          image_url: item.images.icon || null,
          icon_url: item.images.smallIcon || null,
          featured_image_url: item.images.featured || null,
          last_seen_at: now,
        },
        create: {
          internal_sku: `FORT-${item.id}`,
          fortnite_product_id: item.id,
          name: item.name,
          slug,
          description: item.description,
          type: mapProductType(item.type.value) as any,
          rarity: mapRarity(item.rarity?.value || 'COMMON') as any,
          series: item.series?.value || null,
          price_vbucks: entry.finalPrice,
          image_url: item.images.icon || null,
          icon_url: item.images.smallIcon || null,
          featured_image_url: item.images.featured || null,
          giftable: entry.giftable ? 'GIFTABLE' : 'NOT_GIFTABLE',
          active: true,
          visible: true,
          first_seen_at: now,
          last_seen_at: now,
        },
      })

      productCount++

      // Create shop item
      await prisma.shopItem.create({
        data: {
          shop_snapshot_id: snapshot.id,
          product_id: product.id,
          price_vbucks: entry.finalPrice,
          display_order: itemCount,
          section: entry.layout?.name || null,
          layout_id: entry.layout?.id || null,
          theme: extractEntryTheme(entry) ?? undefined,
          offer_id: entry.offerId || null,
          bundle_info: entry.bundle || null,
          featured: entry.layout?.name?.toLowerCase().includes('featured') || false,
        },
      })

      itemCount++
    }
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
