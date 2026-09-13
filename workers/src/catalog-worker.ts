import { Worker, Queue } from 'bullmq'
import IORedis from 'ioredis'
import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@kindstyle/database'
import { createProvider, type NormalizedShopEntry } from './providers'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const SYNC_INTERVAL_MS = parseInt(process.env.CATALOG_SYNC_INTERVAL || '3600000')
const SHOP_CACHE_KEY = 'catalog:shop:current'
const SYNC_LOCK_KEY = 'catalog:sync:lock'
const LOCK_TTL_SECONDS = 300

const prisma = new PrismaClient()
const redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })

function bullConnection(): { host: string; port: number } {
  try {
    const url = new URL(REDIS_URL)
    return { host: url.hostname, port: Number(url.port || 6379) }
  } catch {
    return { host: 'localhost', port: 6379 }
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

async function fetchJson<T>(url: string): Promise<T> {
  const apiKey = process.env.FORTNITE_API_KEY || process.env.LEGACY_FORTNITE_API_KEY
  if (!apiKey) {
    throw new Error('FORTNITE_API_KEY (or LEGACY_FORTNITE_API_KEY) is not set')
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

async function syncBannerReferenceData(): Promise<void> {
  const baseUrl = process.env.FORTNITE_API_URL || process.env.LEGACY_FORNITE_URL || 'https://fortnite-api.com'
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

async function upsertSpecialProduct(
  tx: Prisma.TransactionClient,
  product: NormalizedShopEntry,
  nextSkuNum: { value: number },
): Promise<string | null> {
  const existing = await tx.product.findFirst({
    where: { fortnite_product_id: product.fortniteProductId },
  })

  if (existing) {
    // Only update images, don't overwrite admin-configured prices
    const updateData: any = {
      image_url: product.imageUrl,
      icon_url: product.iconUrl,
      last_seen_at: new Date(),
    }

    // Only update name/slug if they changed (but preserve admin customizations)
    if (existing.name !== product.name) {
      updateData.name = product.name
    }

    await tx.product.update({
      where: { id: existing.id },
      data: updateData,
    })

    console.log(`[CatalogWorker] Updated special product: ${existing.name} (${existing.fortnite_product_id})`)
    return existing.id
  } else {
    // Create new special product
    nextSkuNum.value++
    const sku = `FORT-${String(nextSkuNum.value).padStart(6, '0')}`

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

    console.log(`[CatalogWorker] Created special product: ${newProduct.name} (${newProduct.fortnite_product_id})`)
    return newProduct.id
  }
}

export async function syncCatalog(): Promise<void> {
  const locked = await acquireLock()
  if (!locked) {
    console.log('[CatalogWorker] Another sync is already running. Skipping.')
    return
  }

  try {
    const provider = createProvider()
    console.log(`[CatalogWorker] Using provider: ${provider.name} v${provider.version}`)

    const result = await provider.fetchShop()

    if (!result.success || !result.data) {
      console.error('[CatalogWorker] Provider fetch failed:', result.error)
      return
    }

    const normalizedShop = result.data
    const checksum = normalizedShop.checksum

    // Fallback: if provider didn't include Crew/BattlePass, pull from existing DB products
    const SPECIAL_FALLBACK_IDS = ['CREW_CURRENT', 'BATTLE_PASS_CURRENT']
    for (const fallbackId of SPECIAL_FALLBACK_IDS) {
      const hasProduct = normalizedShop.specialProducts.some(
        (p) => p.fortniteProductId === fallbackId
      )
      if (!hasProduct) {
        const existingProduct = await prisma.product.findFirst({
          where: { fortnite_product_id: fallbackId },
        })
        if (existingProduct) {
          console.log(`[CatalogWorker] Fallback: using existing DB product for ${fallbackId}`)
          normalizedShop.specialProducts.push({
            fortniteProductId: existingProduct.fortnite_product_id,
            name: existingProduct.name,
            slug: existingProduct.slug,
            description: existingProduct.description,
            type: existingProduct.type,
            rarity: existingProduct.rarity,
            series: existingProduct.series,
            priceVbucks: existingProduct.price_vbucks,
            imageUrl: existingProduct.image_url,
            iconUrl: existingProduct.icon_url,
            featuredImageUrl: existingProduct.featured_image_url,
            giftable: existingProduct.giftable,
            section: null,
            layoutId: null,
            offerId: null,
            bundleInfo: null,
          })
        }
      }
    }

    const latestSnapshot = await prisma.shopSnapshot.findFirst({
      orderBy: { fetched_at: 'desc' },
      select: { checksum: true },
    })

    if (latestSnapshot && latestSnapshot.checksum === checksum) {
      console.log('[CatalogWorker] No changes detected. Skipping.')
      return
    }

    console.log('[CatalogWorker] Changes detected. Processing...')

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

      // Upsert regular products
      for (const product of new Map(normalizedShop.entries.map((p) => [p.fortniteProductId, p])).values()) {
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

      // Upsert special products (VBucks, Battle Pass, Crew)
      const specialProductIdMap = new Map<string, string>()
      const skuCounter = { value: nextSkuNum }
      for (const specialProduct of normalizedShop.specialProducts) {
        const productId = await upsertSpecialProduct(tx, specialProduct, skuCounter)
        if (productId) {
          specialProductIdMap.set(specialProduct.fortniteProductId, productId)
        }
      }

      const snapshot = await tx.shopSnapshot.create({
        data: {
          provider: normalizedShop.provider,
          fetched_at: new Date(),
          shop_date: new Date(normalizedShop.shopDate),
          raw_payload: normalizedShop as any,
          checksum,
        },
      })

      let displayOrder = 0

      // Create shop_items for regular products
      for (const product of normalizedShop.entries) {
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
              offer_id: product.offerId,
              bundle_info: product.bundleInfo || undefined,
              theme: product.theme ? (product.theme as Prisma.InputJsonValue) : undefined,
              featured: displayOrder <= 5,
            },
          })
        }
      }

      // Create shop_items for special products (with section = null for display model grouping)
      for (const specialProduct of normalizedShop.specialProducts) {
        const productId = specialProductIdMap.get(specialProduct.fortniteProductId)
        if (productId) {
          await tx.shopItem.create({
            data: {
              shop_snapshot_id: snapshot.id,
              product_id: productId,
              price_vbucks: specialProduct.priceVbucks,
              display_order: displayOrder++,
              section: null, // Special products are grouped by type, not section
              layout_id: null,
              offer_id: specialProduct.offerId,
              theme: specialProduct.theme ? (specialProduct.theme as Prisma.InputJsonValue) : undefined,
              featured: false,
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
    this.queue = new Queue('catalog-sync', { connection: bullConnection() })

    this.worker = new Worker('catalog-sync', async () => {
      await syncCatalog()
    }, { connection: bullConnection() })

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
