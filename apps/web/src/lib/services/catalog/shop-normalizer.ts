import type { ProductType, Rarity } from '@kindstyle/database'
import { TYPE_MAP, RARITY_MAP } from './mappings'
import { resolveGiftability } from './giftability-engine'
import type { FortniteShopEntry, FortniteShopItem } from './fortnite-api'

export interface NormalizedProduct {
  fortniteProductId: string
  fortniteOfferId: string | null
  name: string
  slug: string
  description: string | null
  type: ProductType
  subcategory: string | null
  rarity: Rarity | null
  series: string | null
  priceVbucks: number
  imageUrl: string | null
  iconUrl: string | null
  featuredImageUrl: string | null
  bannerUrl: string | null
  giftable: 'GIFTABLE' | 'NOT_GIFTABLE' | 'UNKNOWN'
}

export function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function resolveProductType(value: string | undefined): ProductType {
  if (!value) return 'OTHER'

  const normalized = value.toLowerCase().replace(/[_\s]/g, '')
  return TYPE_MAP[normalized] || 'OTHER'
}

export function resolveRarity(value: string | undefined): Rarity | null {
  if (!value) return null
  return RARITY_MAP[value] || null
}

export function extractImageUrl(item: FortniteShopItem): string | null {
  if (item.images?.featured) return item.images.featured
  if (item.images?.icon) return item.images.icon
  if (item.images?.smallIcon) return item.images.smallIcon
  if (item.images?.largeIcon) return item.images.largeIcon
  return null
}

export function extractFeaturedImage(item: FortniteShopItem): string | null {
  if (item.images?.featured) return item.images.featured
  if (item.images?.fullBackground) return item.images.fullBackground
  return null
}

export function normalizeShopEntry(
  entry: FortniteShopEntry,
  offerId: string | null = null
): NormalizedProduct[] {
  if (!entry.items || entry.items.length === 0) {
    return []
  }

  const isBundle = entry.items.length > 1

  if (isBundle) {
    const primaryItem = entry.items[0]
    const bundleName = `${primaryItem.name} Bundle`
    const productType: ProductType = 'BUNDLE'

    return [{
      fortniteProductId: primaryItem.id,
      fortniteOfferId: offerId,
      name: bundleName,
      slug: normalizeSlug(bundleName),
      description: primaryItem.description || null,
      type: productType,
      subcategory: 'BUNDLE',
      rarity: resolveRarity(primaryItem.rarity?.value),
      series: primaryItem.series?.value || null,
      priceVbucks: entry.finalPrice || entry.regularPrice || 0,
      imageUrl: extractImageUrl(primaryItem),
      iconUrl: primaryItem.images?.icon || null,
      featuredImageUrl: extractFeaturedImage(primaryItem),
      bannerUrl: entry.newDisplayAsset?.materialInstances?.[0]?.images?.['OfferImage'] || null,
      giftable: resolveGiftability(productType),
    }]
  }

  return entry.items.map((item) => {
    const productType = resolveProductType(item.type?.value)

    return {
      fortniteProductId: item.id,
      fortniteOfferId: offerId,
      name: item.name,
      slug: normalizeSlug(item.name),
      description: item.description || null,
      type: productType,
      subcategory: item.type?.displayValue || null,
      rarity: resolveRarity(item.rarity?.value),
      series: item.series?.value || null,
      priceVbucks: entry.finalPrice || entry.regularPrice || 0,
      imageUrl: extractImageUrl(item),
      iconUrl: item.images?.icon || null,
      featuredImageUrl: extractFeaturedImage(item),
      bannerUrl: entry.newDisplayAsset?.materialInstances?.[0]?.images?.['OfferImage'] || null,
      giftable: resolveGiftability(productType),
    }
  })
}

export function normalizeShopResponse(
  entries: FortniteShopEntry[]
): NormalizedProduct[] {
  const products: NormalizedProduct[] = []

  for (const entry of entries) {
    const normalized = normalizeShopEntry(entry)
    products.push(...normalized)
  }

  return products
}
