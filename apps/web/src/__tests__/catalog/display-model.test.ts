import { describe, it, expect } from 'vitest'
import { buildShopDisplayModel } from '@/lib/services/catalog/display-model'
import type { Product, ShopItem } from '@prisma/client'

type ShopItemWithProduct = ShopItem & { product: Product }

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'test-product-id',
    internal_sku: 'FORT-TEST',
    fortnite_product_id: 'CID_TEST',
    fortnite_offer_id: null,
    name: 'Test Product',
    slug: 'test-product',
    description: null,
    type: 'OUTFIT',
    subcategory: null,
    rarity: 'COMMON',
    series: null,
    price_vbucks: 1000,
    image_url: null,
    icon_url: null,
    featured_image_url: null,
    banner_url: null,
    giftable: 'GIFTABLE',
    active: true,
    visible: true,
    admin_price_mxn: null,
    first_seen_at: null,
    last_seen_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

function createMockShopItem(overrides: Partial<ShopItem> = {}): ShopItem {
  return {
    id: 'test-shop-item-id',
    shop_snapshot_id: 'test-snapshot-id',
    product_id: 'test-product-id',
    price_vbucks: 1000,
    display_order: 0,
    section: 'Featured',
    layout_id: null,
    theme: null,
    offer_id: null,
    bundle_info: null,
    featured: false,
    created_at: new Date(),
    ...overrides,
  }
}

let mockSeq = 0

function createMockShopItemWithProduct(
  productOverrides: Partial<Product> = {},
  itemOverrides: Partial<ShopItem> = {}
): ShopItemWithProduct {
  mockSeq++
  const productId = `test-product-${mockSeq}`
  return {
    ...createMockShopItem({ id: `test-shop-item-${mockSeq}`, product_id: productId, ...itemOverrides }),
    product: createMockProduct({ id: productId, ...productOverrides }),
  } as ShopItemWithProduct
}

describe('buildShopDisplayModel', () => {
  it('should create ShopDisplayItem for item without bundle', () => {
    const items = [
      createMockShopItemWithProduct(
        { name: 'Test Skin' },
        { section: 'Featured', bundle_info: null }
      ),
    ]

    const result = buildShopDisplayModel(items)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Featured')
    expect(result[0].entries).toHaveLength(1)
    expect(result[0].entries[0].type).toBe('item')
    if (result[0].entries[0].type === 'item') {
      expect(result[0].entries[0].product.name).toBe('Test Skin')
    }
  })

  it('should create ShopDisplayBundle for item with bundle_info', () => {
    const items = [
      createMockShopItemWithProduct(
        { name: 'Bundle Item 1' },
        {
          section: 'Looney Tunes',
          bundle_info: { name: 'Pato Lucas', info: 'Bundle', image: 'https://example.com/image.png' },
        }
      ),
    ]

    const result = buildShopDisplayModel(items)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Looney Tunes')
    expect(result[0].entries).toHaveLength(1)
    expect(result[0].entries[0].type).toBe('bundle')
    if (result[0].entries[0].type === 'bundle') {
      expect(result[0].entries[0].name).toBe('Pato Lucas')
      expect(result[0].entries[0].imageUrl).toBe('https://example.com/image.png')
      expect(result[0].entries[0].components).toContain('Bundle Item 1')
    }
  })

  it('should exclude empty sections', () => {
    const items: ShopItemWithProduct[] = []

    const result = buildShopDisplayModel(items)

    expect(result).toHaveLength(0)
  })

  it('should group items by section', () => {
    const items = [
      createMockShopItemWithProduct({ name: 'Item 1' }, { section: 'Featured' }),
      createMockShopItemWithProduct({ name: 'Item 2' }, { section: 'Featured' }),
      createMockShopItemWithProduct({ name: 'Item 3' }, { section: 'Daily' }),
    ]

    const result = buildShopDisplayModel(items)

    expect(result).toHaveLength(2)
    expect(result.find((s) => s.title === 'Featured')?.entries).toHaveLength(2)
    expect(result.find((s) => s.title === 'Daily')?.entries).toHaveLength(1)
  })

  it('should handle items without section', () => {
    const items = [
      createMockShopItemWithProduct({ name: 'No Section Item' }, { section: null }),
    ]

    const result = buildShopDisplayModel(items)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Otros')
  })

  it('should show each loose product only once across sections', () => {
    const items = [
      createMockShopItemWithProduct(
        { id: 'prod-dup', name: 'Duplicado' },
        { id: 'si-1', product_id: 'prod-dup', section: 'Destacados', display_order: 0 }
      ),
      createMockShopItemWithProduct(
        { id: 'prod-dup', name: 'Duplicado' },
        { id: 'si-2', product_id: 'prod-dup', section: 'Diaria', display_order: 1 }
      ),
    ]

    const result = buildShopDisplayModel(items)
    const totalEntries = result.reduce((acc, s) => acc + s.entries.length, 0)

    expect(totalEntries).toBe(1)
  })

  it('should dedupe repeated bundle rows for the same offer and product', () => {
    const bundleInfo = { name: 'Lote', info: 'Bundle', image: 'https://example.com/b.png' }
    const items = [
      createMockShopItemWithProduct(
        { id: 'prod-a', name: 'A' },
        { id: 'si-1', product_id: 'prod-a', section: 'Lotes', offer_id: 'offer-1', bundle_info: bundleInfo, display_order: 0 }
      ),
      createMockShopItemWithProduct(
        { id: 'prod-a', name: 'A' },
        { id: 'si-2', product_id: 'prod-a', section: 'Lotes', offer_id: 'offer-1', bundle_info: bundleInfo, display_order: 1 }
      ),
    ]

    const result = buildShopDisplayModel(items)

    expect(result).toHaveLength(1)
    expect(result[0].entries).toHaveLength(1)
  })
})

const REF_BANNERS = [
  { id: 'ref-a', iconUrl: 'https://fortnite-api.com/images/banners/ref-a/icon.png' },
  { id: 'ref-b', iconUrl: 'https://fortnite-api.com/images/banners/ref-b/icon.png' },
  { id: 'ref-c', iconUrl: 'https://fortnite-api.com/images/banners/ref-c/icon.png' },
  { id: 'ref-d', iconUrl: 'https://fortnite-api.com/images/banners/ref-d/icon.png' },
]

describe('buildShopDisplayModel section banners', () => {
  it('resolves banner image + gradient from the featured entry theme', () => {
    const items = [
      createMockShopItemWithProduct(
        { name: 'Other Item' },
        {
          section: 'Kai Cenat',
          layout_id: 'KaiCenat',
          featured: false,
          theme: { tileImage: 'https://fortnite-api.com/images/shop/other.png', color1: '#111111' },
        }
      ),
      createMockShopItemWithProduct(
        { name: 'Featured Item' },
        {
          section: 'Kai Cenat',
          layout_id: 'KaiCenat',
          featured: true,
          theme: {
            tileImage: 'https://fortnite-api.com/images/shop/featured.png',
            color1: '#f86b71ff',
            color3: '#ffa9a5ff',
            textBackgroundColor: '#784042ff',
          },
        }
      ),
    ]

    const result = buildShopDisplayModel(items)

    expect(result[0].layoutId).toBe('KaiCenat')
    expect(result[0].banner).toEqual({
      image: 'https://fortnite-api.com/images/shop/featured.png',
      gradient: ['#f86b71ff', '#ffa9a5ff'],
    })
  })

  it('uses first item as base when none is featured', () => {
    const items = [
      createMockShopItemWithProduct(
        { name: 'First' },
        {
          section: 'Aura maxima',
          layout_id: 'AuraMax',
          display_order: 0,
          theme: { tileImage: 'https://fortnite-api.com/images/shop/first.png' },
        }
      ),
      createMockShopItemWithProduct(
        { name: 'Second' },
        {
          section: 'Aura maxima',
          layout_id: 'AuraMax',
          display_order: 1,
          theme: { tileImage: 'https://fortnite-api.com/images/shop/second.png' },
        }
      ),
    ]

    const result = buildShopDisplayModel(items)

    expect(result[0].banner?.image).toBe('https://fortnite-api.com/images/shop/first.png')
  })

  it('falls back to a deterministic reference banner when no theme exists', () => {
    const items = [
      createMockShopItemWithProduct({ name: 'A' }, { section: 'Seccion A', layout_id: 'LayoutA' }),
      createMockShopItemWithProduct({ name: 'B' }, { section: 'Seccion B', layout_id: 'LayoutB' }),
    ]

    const first = buildShopDisplayModel(items, REF_BANNERS)
    const second = buildShopDisplayModel(items, REF_BANNERS)

    expect(first[0].banner?.image).toBeTruthy()
    expect(first[1].banner?.image).toBeTruthy()
    expect(first[0].banner?.image).not.toBe(first[1].banner?.image)
    expect(second).toEqual(first)
  })

  it('leaves banner undefined when there is no theme and no reference banners', () => {
    const items = [
      createMockShopItemWithProduct({ name: 'A' }, { section: 'Seccion A', layout_id: 'LayoutA' }),
    ]

    const result = buildShopDisplayModel(items)

    expect(result[0].banner).toBeUndefined()
  })

  it('ignores non-whitelisted theme images and falls back to references', () => {
    const items = [
      createMockShopItemWithProduct(
        { name: 'A' },
        {
          section: 'Seccion A',
          layout_id: 'LayoutA',
          theme: { tileImage: 'https://evil.example.com/x.png' },
        }
      ),
    ]

    const result = buildShopDisplayModel(items, REF_BANNERS)

    expect(result[0].banner?.image).toContain('fortnite-api.com')
  })

  it('uses textBackgroundColor as solid background when no gradient pair exists', () => {
    const items = [
      createMockShopItemWithProduct(
        { name: 'A' },
        {
          section: 'Seccion A',
          layout_id: 'LayoutA',
          theme: { color1: '#112233', textBackgroundColor: '#445566' },
        }
      ),
    ]

    const result = buildShopDisplayModel(items, REF_BANNERS)

    expect(result[0].banner).toEqual({ backgroundColor: '#445566' })
  })

  it('does not leak the Otros theme into a layout section banner', () => {
    const items = [
      createMockShopItemWithProduct(
        { name: 'No Layout' },
        {
          section: null,
          layout_id: null,
          theme: { tileImage: 'https://fortnite-api.com/images/shop/orros-only.png' },
        }
      ),
      createMockShopItemWithProduct({ name: 'In Layout' }, { section: 'Rambo', layout_id: 'Rambo' }),
    ]

    const result = buildShopDisplayModel(items)

    const rambo = result.find((s) => s.title === 'Rambo')
    const otros = result.find((s) => s.title === 'Otros')
    expect(rambo?.banner).toBeUndefined()
    expect(otros?.banner?.image).toBe('https://fortnite-api.com/images/shop/orros-only.png')
  })
})
