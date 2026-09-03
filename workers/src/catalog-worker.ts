import { Worker, Queue } from 'bullmq'
import IORedis from 'ioredis'
import { createHash } from 'crypto'
import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@kindstyle/database'
import { extractEntryTheme, type ShopEntryTheme } from '@kindstyle/shared'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const SYNC_INTERVAL_MS = parseInt(process.env.CATALOG_SYNC_INTERVAL || '3600000')
const SHOP_CACHE_KEY = 'catalog:shop:current'
const SYNC_LOCK_KEY = 'catalog:sync:lock'
const LOCK_TTL_SECONDS = 300

const prisma = new PrismaClient()
const redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })

interface FortniteShopItem {
  id: string
  name: string
  description: string
  type: { value: string; displayValue: string }
  rarity: { value: string; displayValue: string } | null
  series: { value: string; displayValue: string } | null
  images: { icon?: string; featured?: string; smallIcon?: string; largeIcon?: string }
  gameplayTags: string[]
  showcaseVideo: string | null
  variants: unknown[]
  banner: string | null
}

interface FortniteShopEntry {
  regularPrice: number
  finalPrice: number
  colors: Record<string, string> | null
  items: FortniteShopItem[]
  granted: unknown[]
  layout?: { id: string; name: string }
  offerId?: string
  bundle?: { name: string; info: string; image: string }
  brItems?: FortniteShopItem[]
  newDisplayAsset?: {
    id: string
    materialInstances: Array<{ images: Record<string, string> }>
    renderImages?: Array<{ image?: string } | null>
  }
}

interface FortniteBannerApiItem {
  id: string
  devName: string
  name: string
  description: string | null
  category: string | null
  images?: { smallIcon?: string; icon?: string }
}

interface FortniteBannerColorApiItem {
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
    shopHistory: string[]
    entries: FortniteShopEntry[]
  }
}

const TYPE_MAP: Record<string, string> = {
  'outfit': 'OUTFIT',
  'backbling': 'BACK_BLING',
  'pickaxe': 'PICKAXE',
  'glider': 'GLIDER',
  'emote': 'EMOTE',
  'wrap': 'WRAP',
  'music': 'MUSIC_PACK',
  'loadingscreen': 'LOADING_SCREEN',
  'spray': 'SPRAY',
  'contrail': 'CONTRAIL',
  'toy': 'TOY',
  'banner': 'BANNER',
  'bundle': 'BUNDLE',
  'musicpack': 'MUSIC_PACK',
}

const RARITY_MAP: Record<string, string> = {
  'Common': 'COMMON',
  'Uncommon': 'UNCOMMON',
  'Rare': 'RARE',
  'Epic': 'EPIC',
  'Legendary': 'LEGENDARY',
  'Mythic': 'MYTHIC',
  'Exotic': 'EXOTIC',
  'IconSeries': 'ICON_SERIES',
  'StarWarsSeries': 'STAR_WARS',
  'DCSeries': 'DC',
  'MarvelSeries': 'MARVEL',
  'GamingLegends': 'GAMING_LEGENDS',
  'LavaSeries': 'LAVA',
  'FrozenSeries': 'FROZEN',
  'ShadowSeries': 'SHADOW',
  'SlurpSeries': 'SLURP',
  'DarkSeries': 'DARK',
}

const NOT_GIFTABLE = ['VBucks', 'BATTLE_PASS', 'CREW']

function resolveGiftability(type: string): string {
  if (NOT_GIFTABLE.includes(type)) return 'NOT_GIFTABLE'
  if (type === 'BUNDLE') return 'UNKNOWN'
  return 'GIFTABLE'
}

function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function resolveType(value: string | undefined): string {
  if (!value) return 'OTHER'
  return TYPE_MAP[value.toLowerCase().replace(/[_\s]/g, '')] || 'OTHER'
}

function resolveRarity(value: string | undefined): string | null {
  if (!value) return null
  return RARITY_MAP[value] || null
}

function computeChecksum(payload: unknown): string {
  const serialized = JSON.stringify(payload, Object.keys(payload as object).sort())
  return createHash('sha256').update(serialized).digest('hex')
}

async function fetchJson<T>(url: string): Promise<T> {
  const apiKey = process.env.FORTNITE_API_KEY
  if (!apiKey) {
    throw new Error('FORTNITE_API_KEY is not set')
  }

  const response = await fetch(url, {
    headers: { 'Authorization': apiKey, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const body = (await response.json()) as { status: number }

  if (body.status !== 200) {
    throw new Error(`API returned status ${body.status}`)
  }

  return body as T
}

async function fetchShop(): Promise<FortniteShopResponse> {
  const baseUrl = process.env.FORTNITE_API_URL || 'https://fortnite-api.com'
  const language = process.env.FORTNITE_API_LANGUAGE || 'es'
  const url = `${baseUrl}/v2/shop?language=${language}`
  console.log(`[CatalogWorker] Fetching shop from ${url}`)

  const data = await fetchJson<FortniteShopResponse>(url)

  console.log(`[CatalogWorker] Fetched ${data.data.entries.length} entries`)
  return data
}

async function syncBannerReferenceData(): Promise<void> {
  const baseUrl = process.env.FORTNITE_API_URL || 'https://fortnite-api.com'
  const language = process.env.FORTNITE_API_LANGUAGE || 'es'

  try {
    const [bannersRes, colorsRes] = await Promise.all([
      fetchJson<{ data: FortniteBannerApiItem[] }>(`${baseUrl}/v1/banners?language=${language}`),
      fetchJson<{ data: FortniteBannerColorApiItem[] }>(`${baseUrl}/v1/banners/colors`),
    ])

    const syncedAt = new Date()
    const CHUNK_SIZE = 50

    for (let i = 0; i < bannersRes.data.length; i += CHUNK_SIZE) {
      const chunk = bannersRes.data.slice(i, i + CHUNK_SIZE)
      await Promise.all(
        chunk.map((banner) =>
          prisma.fortniteBanner.upsert({
            where: { id: banner.id },
            update: {
              dev_name: banner.devName || null,
              name: banner.name,
              category: banner.category || null,
              small_icon_url: banner.images?.smallIcon || null,
              icon_url: banner.images?.icon || null,
              synced_at: syncedAt,
            },
            create: {
              id: banner.id,
              dev_name: banner.devName || null,
              name: banner.name,
              category: banner.category || null,
              small_icon_url: banner.images?.smallIcon || null,
              icon_url: banner.images?.icon || null,
              synced_at: syncedAt,
            },
          })
        )
      )
    }

    for (let i = 0; i < colorsRes.data.length; i += CHUNK_SIZE) {
      const chunk = colorsRes.data.slice(i, i + CHUNK_SIZE)
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

    console.log(
      `[CatalogWorker] Banner reference synced: ${bannersRes.data.length} banners, ${colorsRes.data.length} colors`
    )
  } catch (error) {
    console.error('[CatalogWorker] Banner reference sync failed (shop sync unaffected):', error)
  }
}

async function acquireLock(): Promise<boolean> {
  const acquired = await redis.set(SYNC_LOCK_KEY, '1', 'EX', LOCK_TTL_SECONDS, 'NX')
  return acquired === 'OK'
}

async function releaseLock(): Promise<void> {
  await redis.del(SYNC_LOCK_KEY)
}

async function invalidateCache(): Promise<void> {
  await redis.del(SHOP_CACHE_KEY)
  console.log('[CatalogWorker] Shop cache invalidated')
}

export async function syncCatalog(): Promise<void> {
  const locked = await acquireLock()
  if (!locked) {
    console.log('[CatalogWorker] Another sync is already running. Skipping.')
    return
  }

  try {
    const shopResponse = await fetchShop()
    const rawPayload = shopResponse.data
    const checksum = computeChecksum(rawPayload)

    const latestSnapshot = await prisma.shopSnapshot.findFirst({
      orderBy: { fetched_at: 'desc' },
      select: { checksum: true },
    })

    if (latestSnapshot && latestSnapshot.checksum === checksum) {
      console.log('[CatalogWorker] No changes detected. Skipping.')
      return
    }

    console.log('[CatalogWorker] Changes detected. Processing...')

    const normalizedProducts: Array<{
      fortniteProductId: string
      name: string
      slug: string
      description: string | null
      type: string
      rarity: string | null
      series: string | null
      priceVbucks: number
      imageUrl: string | null
      iconUrl: string | null
      featuredImageUrl: string | null
      giftable: string
      section: string | null
      layoutId: string | null
      theme: ShopEntryTheme | null
      offerId: string | null
      bundleInfo: { name: string; info: string; image: string } | null
    }> = []

    const seenLooseItemKeys = new Set<string>()
    const seenBundleItemKeys = new Set<string>()

    for (const entry of shopResponse.data.entries) {
      const entryItems = entry.brItems ?? entry.items
      if (!entryItems || entryItems.length === 0) continue

      const isBundle = entryItems.length > 1 || Boolean(entry.bundle)
      const section = entry.layout?.name || null
      const layoutId = entry.layout?.id || null
      const theme = extractEntryTheme(entry)
      const offerId = entry.offerId || null
      const bundleInfo = entry.bundle || (entryItems.length > 1
        ? {
            name: `${entryItems[0].name} y más`,
            info: 'Bundle',
            image: entryItems[0].images?.featured || entryItems[0].images?.icon || '',
          }
        : null)

      for (const item of entryItems) {
        if (isBundle) {
          const bundleKey = `${offerId ?? 'no-offer'}|${item.id}`
          if (seenBundleItemKeys.has(bundleKey)) continue
          seenBundleItemKeys.add(bundleKey)
        } else {
          if (seenLooseItemKeys.has(item.id)) continue
          seenLooseItemKeys.add(item.id)
        }

        const productType = resolveType(item.type?.value)
        normalizedProducts.push({
          fortniteProductId: item.id,
          name: item.name,
          slug: normalizeSlug(item.name),
          description: item.description || null,
          type: productType,
          rarity: resolveRarity(item.rarity?.value),
          series: item.series?.value || null,
          priceVbucks: entry.finalPrice || entry.regularPrice || 0,
          imageUrl: item.images?.featured || item.images?.icon || null,
          iconUrl: item.images?.icon || null,
          featuredImageUrl: item.images?.featured || null,
          giftable: resolveGiftability(productType),
          section,
          layoutId,
          theme,
          offerId,
          bundleInfo,
        })
      }
    }

    await prisma.$transaction(async (tx) => {
      let nextSkuNum = 0
      const lastProduct = await tx.product.findFirst({
        where: {
          internal_sku: { gte: 'FORT-000000', lte: 'FORT-999999' },
        },
        orderBy: { internal_sku: 'desc' },
        select: { internal_sku: true },
      })
      if (lastProduct) {
        const parsed = parseInt(lastProduct.internal_sku.replace('FORT-', ''), 10)
        if (Number.isFinite(parsed)) {
          nextSkuNum = parsed
        }
      }

      const productMap = new Map<string, string>()

      for (const product of new Map(normalizedProducts.map((p) => [p.fortniteProductId, p])).values()) {
        const existing = await tx.product.findFirst({
          where: { fortnite_product_id: product.fortniteProductId },
        })

        if (existing) {
          await tx.product.update({
            where: { id: existing.id },
            data: {
              name: product.name,
              description: product.description,
              type: product.type as any,
              rarity: product.rarity as any,
              series: product.series,
              price_vbucks: product.priceVbucks,
              image_url: product.imageUrl,
              icon_url: product.iconUrl,
              featured_image_url: product.featuredImageUrl,
              giftable: product.giftable as any,
              last_seen_at: new Date(),
            },
          })
          productMap.set(product.fortniteProductId, existing.id)
        } else {
          nextSkuNum++
          const sku = `FORT-${String(nextSkuNum).padStart(6, '0')}`

          let slug = product.slug
          let suffix = 1
          while (await tx.product.findUnique({ where: { slug } })) {
            suffix++
            slug = `${product.slug}-${suffix}`
          }

          const newProduct = await tx.product.create({
            data: {
              internal_sku: sku,
              fortnite_product_id: product.fortniteProductId,
              name: product.name,
              slug,
              description: product.description,
              type: product.type as any,
              rarity: product.rarity as any,
              series: product.series,
              price_vbucks: product.priceVbucks,
              image_url: product.imageUrl,
              icon_url: product.iconUrl,
              featured_image_url: product.featuredImageUrl,
              giftable: product.giftable as any,
              active: true,
              visible: true,
              first_seen_at: new Date(),
              last_seen_at: new Date(),
            },
          })
          productMap.set(product.fortniteProductId, newProduct.id)
        }
      }

      const snapshot = await tx.shopSnapshot.create({
        data: {
          provider: 'fortnite-api',
          fetched_at: new Date(),
          shop_date: new Date(shopResponse.data.date),
          raw_payload: rawPayload as any,
          checksum,
        },
      })

      let displayOrder = 0
      for (const product of normalizedProducts) {
        const productId = productMap.get(product.fortniteProductId)
        if (productId) {
          await tx.shopItem.create({
            data: {
              shop_snapshot_id: snapshot.id,
              product_id: productId,
              price_vbucks: product.priceVbucks,
              display_order: displayOrder++,
              section: product.section,
              layout_id: product.layoutId,
              theme: (product.theme ?? undefined) as Prisma.InputJsonValue | undefined,
              offer_id: product.offerId,
              bundle_info: product.bundleInfo || undefined,
              featured: displayOrder <= 5,
            },
          })
        }
      }
    })

    await invalidateCache()

    await syncBannerReferenceData()

    console.log('[CatalogWorker] Sync complete')
  } catch (error) {
    console.error('[CatalogWorker] Sync failed:', error)
    throw error
  } finally {
    await releaseLock()
  }
}

export class CatalogWorker {
  private queue!: Queue
  private worker!: Worker

  async start() {
    this.queue = new Queue('catalog-sync', { connection: { host: 'localhost', port: 6379 } })

    this.worker = new Worker('catalog-sync', async () => {
      await syncCatalog()
    }, { connection: { host: 'localhost', port: 6379 } })

    this.worker.on('completed', (job) => {
      console.log(`[CatalogWorker] Job ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      console.error(`[CatalogWorker] Job ${job?.id} failed:`, err.message)
    })

    await this.queue.add('sync', {}, {
      repeat: {
        every: SYNC_INTERVAL_MS,
      },
      jobId: 'catalog-sync-periodic',
    })

    console.log(`[CatalogWorker] Started (interval: ${SYNC_INTERVAL_MS / 1000}s)`)

    const shouldRunImmediately = process.env.CATALOG_SYNC_ON_START !== 'false'
    if (shouldRunImmediately) {
      console.log('[CatalogWorker] Running initial sync...')
      try {
        await syncCatalog()
      } catch (error) {
        console.error('[CatalogWorker] Initial sync failed (will retry on schedule):', error)
      }
    }
  }

  async stop() {
    await this.worker?.close()
    await this.queue?.close()
    await prisma.$disconnect()
    await redis.quit()
    console.log('[CatalogWorker] Stopped')
  }
}
