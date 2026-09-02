import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { createHash } from 'crypto'

const shopFixture = JSON.parse(
  readFileSync(new URL('./fixtures/shop-entries.json', import.meta.url), 'utf-8')
)

const state = vi.hoisted(() => ({
  createdShopItems: [] as Array<Record<string, unknown>>,
  bannerUpserts: [] as Array<Record<string, unknown>>,
  colorUpserts: [] as Array<Record<string, unknown>>,
  latestChecksum: null as string | null,
  snapshotCreates: 0,
}))

vi.mock('@kindstyle/database', () => {
  class PrismaClientMock {
    shopSnapshot = {
      findFirst: async () => (state.latestChecksum ? { checksum: state.latestChecksum } : null),
      create: async () => {
        state.snapshotCreates++
        return { id: 'snap-1' }
      },
    }
    product = {
      findFirst: async () => null,
      findUnique: async () => null,
      create: async (args: { data: Record<string, unknown> }) => ({
        id: `prod-${String(args.data.fortnite_product_id)}`,
      }),
      update: async () => ({}),
    }
    shopItem = {
      create: async (args: { data: Record<string, unknown> }) => {
        state.createdShopItems.push(args.data)
        return {}
      },
    }
    fortniteBanner = {
      upsert: async (args: { where: { id: string } }) => {
        state.bannerUpserts.push(args.where)
        return {}
      },
    }
    fortniteBannerColor = {
      upsert: async (args: { where: { id: string } }) => {
        state.colorUpserts.push(args.where)
        return {}
      },
    }
    $transaction = async (fn: (tx: PrismaClientMock) => Promise<unknown>) => fn(this)
    $disconnect = async () => undefined
  }

  return { PrismaClient: PrismaClientMock }
})

vi.mock('ioredis', () => ({
  default: class RedisMock {
    async set() {
      return 'OK'
    }
    async del() {
      return 1
    }
    async quit() {
      return 'OK'
    }
  },
}))

const { syncCatalog } = await import('../src/catalog-worker')

function jsonResponse(body: unknown, ok = true, status = 200, statusText = 'OK') {
  return { ok, status, statusText, json: async () => body }
}

const bannerPayload = {
  status: 200,
  data: [
    {
      id: 'BannerOne',
      devName: 'BannerOne',
      name: 'Estandarte uno',
      description: 'desc',
      category: 'BattleRoyale',
      images: { smallIcon: 'https://fortnite-api.com/images/banners/one/smallicon.png', icon: 'https://fortnite-api.com/images/banners/one/icon.png' },
    },
    {
      id: 'BannerTwo',
      devName: 'BannerTwo',
      name: 'Estandarte dos',
      description: null,
      category: null,
      images: {},
    },
  ],
}

const colorsPayload = {
  status: 200,
  data: [{ id: 'DefaultColor1', color: 'Gray666666FF', category: 'DefaultColorSet1', subCategoryGroup: 0 }],
}

function stubFetch(bannersStatus: 'ok' | 'fail' = 'ok') {
  const calls: string[] = []
  const fetchMock = vi.fn(async (input: unknown) => {
    const url = String(input)
    calls.push(url)
    if (url.includes('/v2/shop')) return jsonResponse(shopFixture)
    if (bannersStatus === 'fail' && (url.includes('/v1/banners'))) {
      return jsonResponse(null, false, 500, 'Internal Server Error')
    }
    if (url.includes('/v1/banners/colors')) return jsonResponse(colorsPayload)
    if (url.includes('/v1/banners')) return jsonResponse(bannerPayload)
    return jsonResponse(null, false, 404, 'Not Found')
  })
  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, calls }
}

beforeEach(() => {
  process.env.FORTNITE_API_KEY = 'test-key'
  state.createdShopItems = []
  state.bannerUpserts = []
  state.colorUpserts = []
  state.latestChecksum = null
  state.snapshotCreates = 0
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('catalog-worker syncCatalog (shop entries)', () => {
  it('persists layout_id and theme per shop item from a real /v2/shop fixture', async () => {
    stubFetch()

    await syncCatalog()

    expect(state.createdShopItems.length).toBeGreaterThan(0)

    const [first, second, third] = state.createdShopItems
    expect(first).toBeDefined()
    expect(first.layout_id).toBe('SummerBatman')
    const firstTheme = first.theme as { color1?: string; tileImage?: string }
    expect(firstTheme.color1).toMatch(/^#[0-9a-f]{6,8}$/)
    expect(firstTheme.tileImage).toMatch(/^https:\/\/.*fortnite-api\.com/)

    expect(second.layout_id).toBeTruthy()
    expect(second.theme).toBeUndefined()

    expect(third.layout_id).toBeNull()
  })

  it('does not create a new snapshot when checksum matches and skips banner endpoints', async () => {
    const checksum = createHash('sha256')
      .update(JSON.stringify(shopFixture.data, Object.keys(shopFixture.data).sort()))
      .digest('hex')
    state.latestChecksum = checksum
    const { calls } = stubFetch()

    await syncCatalog()

    expect(state.snapshotCreates).toBe(0)
    expect(state.createdShopItems).toHaveLength(0)
    expect(calls.some((u) => u.includes('/v1/banners'))).toBe(false)
  })
})

describe('catalog-worker syncCatalog (banner reference gate)', () => {
  it('upserts banners and colors only when a new snapshot is created', async () => {
    stubFetch()

    await syncCatalog()

    expect(state.snapshotCreates).toBe(1)
    expect(state.bannerUpserts).toHaveLength(2)
    expect(state.colorUpserts).toHaveLength(1)
  })

  it('completes shop sync and keeps previous banner data when banner endpoints fail', async () => {
    stubFetch('fail')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await syncCatalog()

    expect(state.snapshotCreates).toBe(1)
    expect(state.bannerUpserts).toHaveLength(0)
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Banner reference sync failed'),
      expect.anything()
    )
    errorSpy.mockRestore()
  })
})
