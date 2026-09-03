import { createHash } from 'crypto'
import { db } from '@/lib/db/client'
import type { FortniteShopResponse } from './fortnite-api'
import type { NormalizedProduct } from './shop-normalizer'

function computeChecksum(payload: unknown): string {
  const serialized = JSON.stringify(payload, Object.keys(payload as object).sort())
  return createHash('sha256').update(serialized).digest('hex')
}

export async function getLatestSnapshot() {
  return db.shopSnapshot.findFirst({
    orderBy: { fetched_at: 'desc' },
    include: {
      shop_items: {
        include: {
          product: true,
        },
        orderBy: { display_order: 'asc' },
      },
    },
  })
}

export async function getSnapshotByDate(date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return db.shopSnapshot.findFirst({
    where: {
      shop_date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      shop_items: {
        include: {
          product: true,
        },
        orderBy: { display_order: 'asc' },
      },
    },
    orderBy: { fetched_at: 'desc' },
  })
}

export async function createSnapshot(
  shopResponse: FortniteShopResponse,
  normalizedProducts: NormalizedProduct[]
): Promise<{ created: boolean; checksum: string; snapshotId?: string }> {
  const rawPayload = shopResponse.data
  const checksum = computeChecksum(rawPayload)

  const latestSnapshot = await db.shopSnapshot.findFirst({
    orderBy: { fetched_at: 'desc' },
    select: { checksum: true },
  })

  if (latestSnapshot && latestSnapshot.checksum === checksum) {
    console.log('[SnapshotService] No changes detected. Skipping snapshot creation.')
    return { created: false, checksum }
  }

  const shopDate = new Date(shopResponse.data.date)
  const fetchedAt = new Date()

  const snapshot = await db.$transaction(async (tx) => {
    const newSnapshot = await tx.shopSnapshot.create({
      data: {
        provider: 'fortnite-api',
        fetched_at: fetchedAt,
        shop_date: shopDate,
        raw_payload: rawPayload as any,
        checksum,
      },
    })

    let displayOrder = 0
    const seenLooseProductIds = new Set<string>()
    const seenBundleKeys = new Set<string>()

    for (const [entryIndex, entry] of shopResponse.data.entries.entries()) {
      const productsForEntry = normalizedProducts.filter((p) => {
        return entry.items.some((item) => item.id === p.fortniteProductId)
      })

      const section = (entry as any).layout?.name || null
      const offerId = (entry as any).offerId || null
      const bundleInfo = (entry as any).bundle || null

      for (const product of productsForEntry) {
        if (bundleInfo) {
          const bundleKey = `${offerId ?? section ?? 'no-offer'}|${product.fortniteProductId}`
          if (seenBundleKeys.has(bundleKey)) continue
          seenBundleKeys.add(bundleKey)
        } else {
          if (seenLooseProductIds.has(product.fortniteProductId)) continue
          seenLooseProductIds.add(product.fortniteProductId)
        }

        const dbProduct = await tx.product.findFirst({
          where: { fortnite_product_id: product.fortniteProductId },
        })

        if (dbProduct) {
          await tx.shopItem.create({
            data: {
              shop_snapshot_id: newSnapshot.id,
              product_id: dbProduct.id,
              price_vbucks: product.priceVbucks,
              display_order: displayOrder++,
              section,
              offer_id: offerId,
              bundle_info: bundleInfo || undefined,
              featured: entryIndex === 0,
            },
          })
        }
      }
    }

    return newSnapshot
  })

  console.log(`[SnapshotService] Snapshot created: ${snapshot.id} (${checksum.slice(0, 8)}...)`)

  return { created: true, checksum, snapshotId: snapshot.id }
}
