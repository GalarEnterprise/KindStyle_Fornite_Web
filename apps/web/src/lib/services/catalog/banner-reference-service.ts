import type { Product, ShopItem } from '@prisma/client'
import type { BannerReference } from '@kindstyle/shared'
import { db } from '@/lib/db/client'
import { buildShopDisplayModel } from './display-model'

type ShopItemWithProduct = ShopItem & { product: Product }

export function requiresBannerFallback(
  items: ShopItemWithProduct[]
): boolean {
  const sections = buildShopDisplayModel(items)
  return sections.some((section) => section.entries.length > 0 && !section.banner)
}

export async function getBannerReferences(
  items: ShopItemWithProduct[]
): Promise<BannerReference[]> {
  if (!requiresBannerFallback(items)) {
    return []
  }

  const rows = await db.fortniteBanner.findMany({
    where: { icon_url: { not: null } },
    orderBy: { id: 'asc' },
    select: { id: true, icon_url: true },
  })

  return rows.map((row) => ({ id: row.id, iconUrl: row.icon_url }))
}
