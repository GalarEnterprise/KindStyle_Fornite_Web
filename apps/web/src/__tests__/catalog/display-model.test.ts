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
    offer_id: null,
    bundle_info: null,
    featured: false,
    created_at: new Date(),
    ...overrides,
  }
}

function createMockShopItemWithProduct(
  productOverrides: Partial<Product> = {},
  itemOverrides: Partial<ShopItem> = {}
): ShopItemWithProduct {
  return {
    ...createMockShopItem(itemOverrides),
    product: createMockProduct(productOverrides),
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
})
