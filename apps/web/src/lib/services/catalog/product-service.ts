import { db } from '@/lib/db/client'
import type { NormalizedProduct } from './shop-normalizer'

type PrismaTxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0]

export async function generateNextSku(tx: PrismaTxClient): Promise<string> {
  const lastProduct = await tx.product.findFirst({
    orderBy: { internal_sku: 'desc' },
    select: { internal_sku: true },
  })

  if (!lastProduct) {
    return 'FORT-000001'
  }

  const lastNumber = parseInt(lastProduct.internal_sku.replace('FORT-', ''), 10)
  const nextNumber = lastNumber + 1

  return `FORT-${String(nextNumber).padStart(6, '0')}`
}

async function ensureUniqueSlug(
  tx: PrismaTxClient,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug
  let suffix = 1

  while (true) {
    const existing = await tx.product.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing) {
      return slug
    }

    suffix++
    slug = `${baseSlug}-${suffix}`
  }
}

export async function upsertProducts(
  products: NormalizedProduct[]
): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0

  await db.$transaction(async (tx) => {
    for (const product of products) {
      const existing = await tx.product.findFirst({
        where: { fortnite_product_id: product.fortniteProductId },
      })

      if (existing) {
        await tx.product.update({
          where: { id: existing.id },
          data: {
            fortnite_offer_id: product.fortniteOfferId,
            name: product.name,
            description: product.description,
            type: product.type,
            subcategory: product.subcategory,
            rarity: product.rarity,
            series: product.series,
            price_vbucks: product.priceVbucks,
            image_url: product.imageUrl,
            icon_url: product.iconUrl,
            featured_image_url: product.featuredImageUrl,
            banner_url: product.bannerUrl,
            giftable: product.giftable,
            last_seen_at: new Date(),
          },
        })
        updated++
      } else {
        const sku = await generateNextSku(tx)
        const slug = await ensureUniqueSlug(tx, product.slug)

        await tx.product.create({
          data: {
            internal_sku: sku,
            fortnite_product_id: product.fortniteProductId,
            fortnite_offer_id: product.fortniteOfferId,
            name: product.name,
            slug,
            description: product.description,
            type: product.type,
            subcategory: product.subcategory,
            rarity: product.rarity,
            series: product.series,
            price_vbucks: product.priceVbucks,
            image_url: product.imageUrl,
            icon_url: product.iconUrl,
            featured_image_url: product.featuredImageUrl,
            banner_url: product.bannerUrl,
            giftable: product.giftable,
            active: true,
            visible: true,
            first_seen_at: new Date(),
            last_seen_at: new Date(),
          },
        })
        created++
      }
    }
  })

  console.log(`[ProductService] Upsert complete: ${created} created, ${updated} updated`)

  return { created, updated }
}

export async function getProductById(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      shop_items: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  })
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      shop_items: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  })
}

export async function getAllProducts(filters?: {
  type?: string
  rarity?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  perPage?: number
}) {
  const { type, rarity, minPrice, maxPrice, page = 1, perPage = 20 } = filters || {}

  const where: any = {
    active: true,
    visible: true,
  }

  if (type) where.type = type
  if (rarity) where.rarity = rarity
  if (minPrice !== undefined) where.price_vbucks = { ...where.price_vbucks, gte: minPrice }
  if (maxPrice !== undefined) where.price_vbucks = { ...where.price_vbucks, lte: maxPrice }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { last_seen_at: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.product.count({ where }),
  ])

  return {
    products,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  }
}

export async function searchProducts(
  query: string,
  page: number = 1,
  perPage: number = 20
) {
  const where = {
    active: true,
    visible: true,
    name: {
      contains: query,
      mode: 'insensitive' as const,
    },
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { last_seen_at: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.product.count({ where }),
  ])

  return {
    products,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  }
}
