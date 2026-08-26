import { db } from '@/lib/db/client'
import { COLLECTION_MAP, PRODUCT_TYPE_LABELS } from './mappings'
import type { ProductType } from '@kindstyle/database'

interface CollectionInfo {
  name: string
  slug: string
  itemCount: number
  type: 'section' | 'product_type'
}

export async function getCollections(): Promise<CollectionInfo[]> {
  const latestSnapshot = await db.shopSnapshot.findFirst({
    orderBy: { fetched_at: 'desc' },
    include: {
      shop_items: {
        select: {
          section: true,
          product: {
            select: {
              type: true,
              active: true,
              visible: true,
            },
          },
        },
      },
    },
  })

  if (!latestSnapshot) {
    return []
  }

  const sectionCounts = new Map<string, number>()
  const typeCounts = new Map<ProductType, number>()
  const hasSectionProducts = new Set<string>()

  for (const item of latestSnapshot.shop_items) {
    if (!item.product.active || !item.product.visible) continue

    if (item.section) {
      const sectionName = COLLECTION_MAP[item.section] || item.section
      hasSectionProducts.add(sectionName)
      sectionCounts.set(sectionName, (sectionCounts.get(sectionName) || 0) + 1)
    } else {
      typeCounts.set(
        item.product.type,
        (typeCounts.get(item.product.type) || 0) + 1
      )
    }
  }

  const collections: CollectionInfo[] = []

  for (const [section, count] of sectionCounts) {
    collections.push({
      name: section,
      slug: section.toLowerCase().replace(/\s+/g, '-'),
      itemCount: count,
      type: 'section',
    })
  }

  if (typeCounts.size > 0) {
    for (const [type, count] of typeCounts) {
      if (!hasSectionProducts.has(PRODUCT_TYPE_LABELS[type])) {
        collections.push({
          name: PRODUCT_TYPE_LABELS[type],
          slug: type.toLowerCase().replace(/_/g, '-'),
          itemCount: count,
          type: 'product_type',
        })
      }
    }
  }

  return collections.sort((a, b) => {
    if (a.type === 'section' && b.type === 'product_type') return -1
    if (a.type === 'product_type' && b.type === 'section') return 1
    return a.name.localeCompare(b.name)
  })
}

export async function getProductsByCollection(
  collectionSlug: string,
  page: number = 1,
  perPage: number = 20
) {
  const latestSnapshot = await db.shopSnapshot.findFirst({
    orderBy: { fetched_at: 'desc' },
    include: {
      shop_items: {
        include: { product: true },
        orderBy: { display_order: 'asc' },
      },
    },
  })

  if (!latestSnapshot) {
    return { products: [], total: 0, page, perPage, totalPages: 0 }
  }

  const sectionName = Object.entries(COLLECTION_MAP).find(
    ([, es]) => es.toLowerCase().replace(/\s+/g, '-') === collectionSlug
  )?.[0]

  let filteredItems = latestSnapshot.shop_items

  if (sectionName) {
    filteredItems = latestSnapshot.shop_items.filter(
      (item) => item.section === sectionName
    )
  } else {
    const productType = Object.entries(PRODUCT_TYPE_LABELS).find(
      ([, label]) => label.toLowerCase().replace(/\s+/g, '-') === collectionSlug
    )?.[0] as ProductType | undefined

    if (productType) {
      filteredItems = latestSnapshot.shop_items.filter(
        (item) => !item.section && item.product.type === productType
      )
    }
  }

  const activeItems = filteredItems.filter(
    (item) => item.product.active && item.product.visible
  )

  const total = activeItems.length
  const totalPages = Math.ceil(total / perPage)
  const start = (page - 1) * perPage
  const items = activeItems.slice(start, start + perPage)

  return {
    products: items.map((item) => item.product),
    total,
    page,
    perPage,
    totalPages,
  }
}
