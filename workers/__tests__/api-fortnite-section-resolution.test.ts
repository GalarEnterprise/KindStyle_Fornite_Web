import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the FortniteAPI
vi.mock('@yaelouuu/fortnite-api', () => ({
  FortniteAPI: vi.fn().mockImplementation(() => ({
    shop: {
      getCurrent: vi.fn().mockResolvedValue({
        storefronts: [
          {
            name: 'BRWeeklyStorefront',
            catalogEntries: [
              {
                offerId: 'offer-1',
                title: 'BMW M4 GT3 EVO',
                sectionDisplayName: 'BMW M4 GT3 EVO',
                layout: { id: 'BMWm4.99', name: 'BMW' },
                itemGrants: [
                  {
                    templateId: 'VehicleCosmetics_Body:carbody_bmw',
                    cosmetic: {
                      name: 'BMW M4 GT3 EVO',
                      type: 'vehicle',
                      rarity: 'legendary',
                      images: { icon: 'bmw.png' },
                    },
                  },
                ],
                prices: [{ currencyType: 'MtxCurrency', finalPrice: 0 }],
                bundle: null,
              },
              {
                offerId: 'offer-2',
                title: 'El revólver',
                sectionDisplayName: 'El revólver',
                layout: { id: 'Zuse.99', name: 'Zuse' },
                itemGrants: [
                  {
                    templateId: 'VehicleCosmetics_Body:carbody_zuse',
                    cosmetic: {
                      name: 'Revolver',
                      type: 'vehicle',
                      rarity: 'epic',
                      images: { icon: 'revolver.png' },
                    },
                  },
                ],
                prices: [{ currencyType: 'MtxCurrency', finalPrice: 0 }],
                bundle: null,
              },
            ],
          },
        ],
      }),
    },
    battlepass: {
      getBattlePass: vi.fn().mockResolvedValue({ messages: [] }),
    },
    crew: {
      getCurrent: vi.fn().mockRejectedValue(new Error('Insufficient plan')),
    },
  })),
}))

const { ApiFortniteProvider } = await import('../src/providers/api-fortnite-provider')

describe('ApiFortniteProvider - Section Resolution', () => {
  let provider: InstanceType<typeof ApiFortniteProvider>

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new ApiFortniteProvider({
      apiKey: 'test-key',
    })
  })

  it('should use sectionDisplayName for each car offer', async () => {
    const result = await provider.fetchShop()

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()

    const entries = result.data!.entries
    expect(entries).toHaveLength(2)

    // Each car should have its own section from sectionDisplayName
    const bmwEntry = entries.find((e: any) => e.name === 'BMW M4 GT3 EVO')
    const revolverEntry = entries.find((e: any) => e.name === 'Revolver')

    expect(bmwEntry?.section).toBe('BMW M4 GT3 EVO')
    expect(revolverEntry?.section).toBe('El revólver')

    // Sections should be different
    expect(bmwEntry?.section).not.toBe(revolverEntry?.section)
  })

  it('should detect DLC offers without itemGrants and create special products', async () => {
    // Add a DLC offer to the mock
    const fortniteApi = await import('@yaelouuu/fortnite-api')
    const mockInstance = (fortniteApi.FortniteAPI as any).mock.results[0].value
    mockInstance.shop.getCurrent.mockResolvedValue({
      storefronts: [
        {
          name: 'BRSeason42',
          catalogEntries: [
            {
              offerId: 'offer-dlc-bp',
              title: 'Pase de Batalla',
              description: 'Pase de Batalla de la Temporada 42',
              metaInfo: { IsBattlePass: 'true', LayoutId: 'BattlePassCrew.2' },
              itemGrants: [],
              prices: [{ currencyType: 'RealMoney', finalPrice: 200 }],
              offerVisual: 'bp-icon.png',
            },
            {
              offerId: 'offer-dlc-levels',
              title: '25 Niveles',
              description: '25 niveles del Pase de Batalla',
              metaInfo: { IsLevelBundle: 'true', LayoutId: 'BattlePassCrew.2' },
              itemGrants: [],
              prices: [{ currencyType: 'RealMoney', finalPrice: 300 }],
              offerVisual: 'levels-icon.png',
            },
            {
              offerId: 'offer-cosmetic',
              title: 'Skin',
              sectionDisplayName: 'Cosméticos',
              itemGrants: [
                {
                  templateId: 'AthenaCharacter:cid_test',
                  cosmetic: {
                    name: 'Test Skin',
                    type: 'outfit',
                    rarity: 'epic',
                    images: { icon: 'skin.png' },
                  },
                },
              ],
              prices: [{ currencyType: 'MtxCurrency', finalPrice: 1200 }],
            },
          ],
        },
      ],
    })

    const result = await provider.fetchShop()

    expect(result.success).toBe(true)
    const specialProducts = result.data!.specialProducts

    // Should have 2 DLC special products (BP + levels)
    const dlcProducts = specialProducts.filter((p: any) => p.type === 'DLC')
    expect(dlcProducts).toHaveLength(2)

    const bp = dlcProducts.find((p: any) => p.name === 'Pase de Batalla')
    const levels = dlcProducts.find((p: any) => p.name === '25 Niveles')

    expect(bp).toBeDefined()
    expect(bp?.priceMxn).toBe(200)
    expect(bp?.giftable).toBe('NOT_GIFTABLE')
    expect(bp?.section).toBe('Pases, Crew y DLC')

    expect(levels).toBeDefined()
    expect(levels?.priceMxn).toBe(300)

    // Regular entries should still work
    expect(result.data!.entries).toHaveLength(1)
    expect(result.data!.entries[0].name).toBe('Test Skin')
  })

  it('should always include 4 V-Bucks denominations as special products', async () => {
    const result = await provider.fetchShop()

    expect(result.success).toBe(true)
    const specialProducts = result.data!.specialProducts

    const vbucksProducts = specialProducts.filter((p: any) => p.type === 'VBucks')
    expect(vbucksProducts).toHaveLength(4)

    const amounts = vbucksProducts.map((p: any) => p.priceVbucks).sort((a: number, b: number) => a - b)
    expect(amounts).toEqual([1000, 2800, 5000, 13500])

    // All should be NOT_GIFTABLE and in V-Bucks section
    for (const vb of vbucksProducts) {
      expect(vb.giftable).toBe('NOT_GIFTABLE')
      expect(vb.section).toBe('V-Bucks')
    }
  })
})
