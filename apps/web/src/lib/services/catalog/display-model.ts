import type { Product, ShopItem } from '@prisma/client'
import {
  isAllowedImageHost,
  parseShopEntryTheme,
  type BannerReference,
} from '@kindstyle/shared'

type ShopItemWithProduct = ShopItem & { product: Product }

export type SpecialProductType = 'VBucks' | 'BATTLE_PASS' | 'CREW'

export type SpecialSectionConfig = {
  type: SpecialProductType
  title: string
  slug: string
  order: number
}

export const SPECIAL_PRODUCT_TYPES: SpecialSectionConfig[] = [
  { type: 'VBucks', title: 'V-Bucks', slug: 'vbucks', order: 0 },
  { type: 'BATTLE_PASS', title: 'Pase de Batalla', slug: 'pase-de-batalla', order: 1 },
  { type: 'CREW', title: 'Fortnite Crew', slug: 'fortnite-crew', order: 2 },
]

const SPECIAL_TYPE_SET = new Set<SpecialProductType>(
  SPECIAL_PRODUCT_TYPES.map((c) => c.type)
)

export type ShopSection = {
  id: string
  title: string
  slug: string
  order: number
  layoutId: string | null
}

export type ShopDisplayBundle = {
  type: 'bundle'
  id: string
  name: string
  imageUrl: string | null
  priceVbucks: number
  components: string[]
  section: string
  offerId: string | null
}

export type ShopDisplayItem = {
  type: 'item'
  id: string
  product: Product
  priceVbucks: number
  section: string
}

export type ShopDisplayEntry = ShopDisplayBundle | ShopDisplayItem

export type ShopDisplayBanner = {
  image?: string
  gradient?: [string, string]
  backgroundColor?: string
}

export type ShopDisplaySection = {
  id: string
  title: string
  slug: string
  order: number
  layoutId: string | null
  entries: ShopDisplayEntry[]
  banner?: ShopDisplayBanner
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

function resolveSectionBanner(
  sectionItems: ShopItemWithProduct[],
  layoutId: string | null,
  slug: string,
  referenceBanners: BannerReference[],
  takenBannerIds: Set<string>
): ShopDisplayBanner | undefined {
  const baseItem =
    sectionItems.find((item) => item.featured) ?? sectionItems[0]

  const theme = parseShopEntryTheme(baseItem?.theme)
  const color1 = theme?.color1
  const color3 = theme?.color3
  const textBackgroundColor = theme?.textBackgroundColor
  const tileImage = isAllowedImageHost(theme?.tileImage) ? theme?.tileImage : undefined

  if (tileImage || (color1 && color3) || textBackgroundColor) {
    const banner: ShopDisplayBanner = {}
    if (tileImage) banner.image = tileImage
    if (color1 && color3) {
      banner.gradient = [color1, color3]
    } else if (textBackgroundColor) {
      banner.backgroundColor = textBackgroundColor
    }
    return banner
  }

  if (referenceBanners.length > 0) {
    const key = layoutId ?? slug
    const baseHash = fnv1a(key)

    for (let salt = 0; salt < referenceBanners.length; salt++) {
      const candidate = referenceBanners[(baseHash + salt) % referenceBanners.length]
      if (!candidate) continue
      if (takenBannerIds.has(candidate.id)) continue
      if (!isAllowedImageHost(candidate.iconUrl)) continue

      takenBannerIds.add(candidate.id)
      return { image: candidate.iconUrl }
    }
  }

  return undefined
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

function extractSections(items: ShopItemWithProduct[]): ShopSection[] {
  const sectionMap = new Map<string, ShopSection>()
  let order = 0

  for (const item of items) {
    if (!item.section) continue

    const existing = sectionMap.get(item.section)
    if (existing) {
      if (!existing.layoutId && item.layout_id) existing.layoutId = item.layout_id
      continue
    }

    const slug = normalizeSlug(item.section)
    sectionMap.set(item.section, {
      id: slug,
      title: item.section,
      slug,
      order: order++,
      layoutId: item.layout_id ?? null,
    })
  }

  return Array.from(sectionMap.values()).sort((a, b) => a.order - b.order)
}

function createDisplayEntry(item: ShopItemWithProduct): ShopDisplayEntry {
  const bundleInfo = item.bundle_info as { name: string; info: string; image: string } | null

  if (bundleInfo) {
    return {
      type: 'bundle',
      id: item.id,
      name: bundleInfo.name,
      imageUrl: bundleInfo.image,
      priceVbucks: item.price_vbucks,
      components: [item.product.name],
      section: item.section || '',
      offerId: item.offer_id,
    }
  }

  return {
    type: 'item',
    id: item.id,
    product: item.product,
    priceVbucks: item.price_vbucks,
    section: item.section || '',
  }
}

function groupBundlesByOfferId(
  items: ShopItemWithProduct[],
  section: string
): ShopDisplayEntry[] {
  const offerGroups = new Map<string, ShopItemWithProduct[]>()
  const noOfferItems: ShopItemWithProduct[] = []

  for (const item of items) {
    if (!item.bundle_info) {
      noOfferItems.push(item)
      continue
    }

    const offerId = item.offer_id || `no-offer-${item.id}`
    if (!offerGroups.has(offerId)) {
      offerGroups.set(offerId, [])
    }
    offerGroups.get(offerId)!.push(item)
  }

  const entries: ShopDisplayEntry[] = []

  for (const [offerId, groupItems] of offerGroups) {
    if (groupItems.length === 1) {
      entries.push(createDisplayEntry(groupItems[0]))
    } else {
      const firstItem = groupItems[0]
      const bundleInfo = firstItem.bundle_info as { name: string; info: string; image: string }
      const componentNames = groupItems.map((item) => item.product.name)

      entries.push({
        type: 'bundle',
        id: firstItem.id,
        name: bundleInfo.name,
        imageUrl: bundleInfo.image,
        priceVbucks: firstItem.price_vbucks,
        components: componentNames,
        section,
        offerId: offerId === `no-offer-${firstItem.id}` ? null : offerId,
      })
    }
  }

  for (const item of noOfferItems) {
    entries.push(createDisplayEntry(item))
  }

  return entries
}

function dedupeShopItems(items: ShopItemWithProduct[]): ShopItemWithProduct[] {
  const seenLooseProductIds = new Set<string>()
  const seenBundleKeys = new Set<string>()
  const deduped: ShopItemWithProduct[] = []

  for (const item of items) {
    if (item.bundle_info) {
      const key = `${item.offer_id ?? item.id}|${item.product_id}`
      if (seenBundleKeys.has(key)) continue
      seenBundleKeys.add(key)
    } else {
      if (seenLooseProductIds.has(item.product_id)) continue
      seenLooseProductIds.add(item.product_id)
    }
    deduped.push(item)
  }

  return deduped
}

export function filterSpecialProducts(
  items: ShopItemWithProduct[],
  types: readonly SpecialProductType[] = SPECIAL_PRODUCT_TYPES.map((c) => c.type)
): ShopItemWithProduct[] {
  const typeSet = new Set(types)
  return items.filter((item) => typeSet.has(item.product.type as SpecialProductType))
}

export function extractRegularItems(
  items: ShopItemWithProduct[]
): ShopItemWithProduct[] {
  return items.filter((item) => !SPECIAL_TYPE_SET.has(item.product.type as SpecialProductType))
}

export function buildSpecialSections(
  filteredItems: ShopItemWithProduct[],
  referenceBanners: BannerReference[],
  takenBannerIds: Set<string>
): ShopDisplaySection[] {
  const sections: ShopDisplaySection[] = []

  for (const config of SPECIAL_PRODUCT_TYPES) {
    const typeItems = filteredItems.filter(
      (item) => item.product.type === config.type
    )
    if (typeItems.length === 0) continue

    const entries = typeItems.map((item) => createDisplayEntry(item))
    const banner = resolveSectionBanner(
      typeItems,
      null,
      config.slug,
      referenceBanners,
      takenBannerIds
    )

    sections.push({
      id: config.slug,
      title: config.title,
      slug: config.slug,
      order: config.order,
      layoutId: null,
      entries,
      banner,
    })
  }

  return sections
}

export function buildShopDisplayModel(
  rawItems: ShopItemWithProduct[],
  referenceBanners: BannerReference[] = []
): ShopDisplaySection[] {
  const items = dedupeShopItems(rawItems)
  const takenBannerIds = new Set<string>()

  const specialItems = filterSpecialProducts(items)
  const regularItems = extractRegularItems(items)

  const specialSections = buildSpecialSections(specialItems, referenceBanners, takenBannerIds)

  const sections = extractSections(regularItems)
  const regularSections: ShopDisplaySection[] = []

  for (const section of sections) {
    const sectionItems = regularItems.filter((item) => item.section === section.title)
    if (sectionItems.length === 0) continue

    const entries = groupBundlesByOfferId(sectionItems, section.title)
    const banner = resolveSectionBanner(sectionItems, section.layoutId, section.slug, referenceBanners, takenBannerIds)

    regularSections.push({
      ...section,
      entries,
      banner,
    })
  }

  const itemsWithoutSection = regularItems.filter((item) => !item.section)
  if (itemsWithoutSection.length > 0) {
    const entries = itemsWithoutSection.map((item) => createDisplayEntry(item))
    const otherBanner = resolveSectionBanner(
      itemsWithoutSection,
      null,
      'otros',
      referenceBanners,
      takenBannerIds
    )
    regularSections.push({
      id: 'other',
      title: 'Otros',
      slug: 'otros',
      order: sections.length,
      layoutId: null,
      entries,
      banner: otherBanner,
    })
  }

  return [...specialSections, ...regularSections]
}
