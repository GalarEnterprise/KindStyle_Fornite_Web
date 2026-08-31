import type { Product, ShopItem } from '@prisma/client'

type ShopItemWithProduct = ShopItem & { product: Product }

export type ShopSection = {
  id: string
  title: string
  slug: string
  order: number
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

export type ShopDisplaySection = {
  id: string
  title: string
  slug: string
  order: number
  entries: ShopDisplayEntry[]
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
    if (sectionMap.has(item.section)) continue

    const slug = normalizeSlug(item.section)
    sectionMap.set(item.section, {
      id: slug,
      title: item.section,
      slug,
      order: order++,
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

export function buildShopDisplayModel(items: ShopItemWithProduct[]): ShopDisplaySection[] {
  const sections = extractSections(items)
  const sectionsWithEntries: ShopDisplaySection[] = []

  for (const section of sections) {
    const sectionItems = items.filter((item) => item.section === section.title)
    if (sectionItems.length === 0) continue

    const entries = groupBundlesByOfferId(sectionItems, section.title)

    sectionsWithEntries.push({
      ...section,
      entries,
    })
  }

  const itemsWithoutSection = items.filter((item) => !item.section)
  if (itemsWithoutSection.length > 0) {
    const entries = itemsWithoutSection.map((item) => createDisplayEntry(item))
    sectionsWithEntries.push({
      id: 'other',
      title: 'Otros',
      slug: 'otros',
      order: sections.length,
      entries,
    })
  }

  return sectionsWithEntries
}
