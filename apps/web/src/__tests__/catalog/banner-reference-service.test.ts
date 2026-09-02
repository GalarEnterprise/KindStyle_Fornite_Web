import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Product, ShopItem } from '@prisma/client'

const findManyMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db/client', () => ({
  db: {
    fortniteBanner: {
      findMany: findManyMock,
    },
  },
}))

import {
  getBannerReferences,
  requiresBannerFallback,
} from '@/lib/services/catalog/banner-reference-service'

type ShopItemWithProduct = ShopItem & { product: Product }

function item(overrides: Partial<ShopItem> = {}): ShopItemWithProduct {
  return {
    id: overrides.id ?? `item-${Math.random()}`,
    shop_snapshot_id: 'snap-1',
    product_id: 'prod-1',
    price_vbucks: 1000,
    display_order: 0,
    section: 'Seccion A',
    layout_id: 'LayoutA',
    theme: null,
    offer_id: null,
    bundle_info: null,
    featured: false,
    created_at: new Date(),
    product: {
      id: 'prod-1',
      name: 'P',
      active: true,
      visible: true,
    },
    ...overrides,
  } as unknown as ShopItemWithProduct
}

beforeEach(() => {
  findManyMock.mockReset()
  findManyMock.mockResolvedValue([
    { id: 'ref-a', icon_url: 'https://fortnite-api.com/images/banners/ref-a/icon.png' },
    { id: 'ref-b', icon_url: 'https://fortnite-api.com/images/banners/ref-b/icon.png' },
  ])
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('banner-reference-service', () => {
  it('does not query fortnite_banners when every section already has derived art', async () => {
    const items = [
      item({
        theme: { tileImage: 'https://fortnite-api.com/images/shop/a.png', color1: '#112233', color3: '#445566' },
      }),
    ]

    expect(requiresBannerFallback(items)).toBe(false)
    const refs = await getBannerReferences(items)

    expect(refs).toEqual([])
    expect(findManyMock).not.toHaveBeenCalled()
  })

  it('issues exactly one ordered query when a section lacks any banner data', async () => {
    const items = [item({ theme: null })]

    expect(requiresBannerFallback(items)).toBe(true)
    const refs = await getBannerReferences(items)

    expect(findManyMock).toHaveBeenCalledTimes(1)
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { id: 'asc' },
        select: { id: true, icon_url: true },
      })
    )
    expect(refs).toEqual([
      { id: 'ref-a', iconUrl: 'https://fortnite-api.com/images/banners/ref-a/icon.png' },
      { id: 'ref-b', iconUrl: 'https://fortnite-api.com/images/banners/ref-b/icon.png' },
    ])
  })

  it('does not query when sections resolve to gradient-only banners (no image needed)', async () => {
    const items = [
      item({ theme: { color1: '#112233', color3: '#445566' } }),
    ]

    const refs = await getBannerReferences(items)

    expect(refs).toEqual([])
    expect(findManyMock).not.toHaveBeenCalled()
  })

  it('queries when the theme image is not on the allowed hosts', async () => {
    const items = [
      item({ theme: { tileImage: 'https://evil.example.com/x.png' } }),
    ]

    await getBannerReferences(items)

    expect(findManyMock).toHaveBeenCalledTimes(1)
  })
})
