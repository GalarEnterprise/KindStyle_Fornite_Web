import { createHash } from 'crypto'
import { FortniteAPI } from '@yaelouuu/fortnite-api'
import type { CatalogProvider, NormalizedShop, ProviderResult, NormalizedShopEntry } from './types'
import { NormalizedShopSchema } from './types'

const TYPE_MAP: Record<string, string> = {
  'outfit': 'OUTFIT',
  'backbling': 'BACK_BLING',
  'pickaxe': 'PICKAXE',
  'glider': 'GLIDER',
  'emote': 'EMOTE',
  'wrap': 'WRAP',
  'music': 'MUSIC_PACK',
  'loadingscreen': 'LOADING_SCREEN',
  'spray': 'SPRAY',
  'contrail': 'CONTRAIL',
  'toy': 'TOY',
  'banner': 'BANNER',
  'bundle': 'BUNDLE',
  'musicpack': 'MUSIC_PACK',
  'vehicle': 'VEHICLE',
  'car': 'VEHICLE',
  'vehicledrug': 'VEHICLE',
  'vehiclebody': 'VEHICLE',
  'vehicleskin': 'VEHICLE',
  'sparkssong': 'JAM_TRACK',
  'sparksong': 'JAM_TRACK',
}

const RARITY_MAP: Record<string, string> = {
  'common': 'COMMON',
  'uncommon': 'UNCOMMON',
  'rare': 'RARE',
  'epic': 'EPIC',
  'legendary': 'LEGENDARY',
  'mythic': 'MYTHIC',
  'exotic': 'EXOTIC',
  'icon': 'ICON_SERIES',
  'starwars': 'STAR_WARS',
  'dc': 'DC',
  'marvel': 'MARVEL',
  'gaminglegends': 'GAMING_LEGENDS',
  'lava': 'LAVA',
  'frozen': 'FROZEN',
  'shadow': 'SHADOW',
  'slurp': 'SLURP',
  'dark': 'DARK',
}

const NOT_GIFTABLE = ['VBucks', 'BATTLE_PASS', 'CREW']

// Stable IDs for special products (aligned with seed.ts)
const SPECIAL_PRODUCT_IDS = {
  VBucks_1000: 'VBucks_1000',
  VBucks_2800: 'VBucks_2800',
  VBucks_5000: 'VBucks_5000',
  VBucks_13500: 'VBucks_13500',
  BATTLE_PASS: 'BATTLE_PASS_CURRENT',
  CREW: 'CREW_CURRENT',
}

function resolveGiftability(type: string): 'GIFTABLE' | 'NOT_GIFTABLE' | 'UNKNOWN' {
  if (NOT_GIFTABLE.includes(type)) return 'NOT_GIFTABLE'
  if (type === 'BUNDLE') return 'UNKNOWN'
  return 'GIFTABLE'
}

function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function resolveType(value: string | undefined): string {
  if (!value) return 'OTHER'
  return TYPE_MAP[value.toLowerCase().replace(/[_\s]/g, '')] || 'OTHER'
}

function resolveRarity(value: string | undefined): string | null {
  if (!value) return null
  return RARITY_MAP[value.toLowerCase()] || null
}

function computeChecksum(payload: unknown): string {
  const serialized = JSON.stringify(payload, Object.keys(payload as object).sort())
  return createHash('sha256').update(serialized).digest('hex')
}

function extractTemplateId(templateId: string): string {
  const parts = templateId.split(':')
  return parts.length > 1 ? parts[1] : templateId
}

function isVBucksEntry(entry: any): boolean {
  // V-Bucks entries have itemGrants that grant Currency: templateIds
  return entry.itemGrants?.some((g: any) =>
    g.templateId?.toLowerCase().startsWith('currency:')
  )
}

function extractVBucksProductId(templateId: string): string | null {
  // Currency templateIds look like: Currency:MtcGiveawayBundles_V1000
  const match = templateId.match(/(\d+)/)
  if (match) {
    const amount = parseInt(match[1], 10)
    if ([1000, 2800, 5000, 13500].includes(amount)) {
      return `VBucks_${amount}`
    }
  }
  return null
}

export class ApiFortniteProvider implements CatalogProvider {
  name = 'api-fortnite'
  version = '10.0.0'

  private client: FortniteAPI
  private language: string
  private timeout: number

  constructor(config: {
    apiKey: string
    baseUrl?: string
    language?: string
    timeout?: number
  }) {
    this.client = new FortniteAPI({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
    })
    this.language = config.language || 'es'
    this.timeout = config.timeout || 30000
  }

  async fetchShop(): Promise<ProviderResult> {
    try {
      console.log(`[ApiFortniteProvider] Fetching shop with language=${this.language}`)

      const shop = await this.client.shop.getCurrent({
        lang: this.language,
      })

      console.log(`[ApiFortniteProvider] Fetched ${shop.storefronts.length} storefronts`)

      // Fetch Battle Pass and Crew in parallel, isolated from shop errors
      const [battlePassResult, crewResult] = await Promise.allSettled([
        this.fetchBattlePass(),
        this.fetchCrew(),
      ])

      const battlePassProduct = battlePassResult.status === 'fulfilled' ? battlePassResult.value : null
      const crewProduct = crewResult.status === 'fulfilled' ? crewResult.value : null

      if (battlePassResult.status === 'rejected') {
        console.error(`[ApiFortniteProvider] Battle Pass fetch failed (non-fatal):`, battlePassResult.reason)
      }
      if (crewResult.status === 'rejected') {
        console.error(`[ApiFortniteProvider] Crew fetch failed (non-fatal):`, crewResult.reason)
      }

      const normalizedShop = this.normalizeResponse(shop, battlePassProduct, crewProduct)

      const validation = NormalizedShopSchema.safeParse(normalizedShop)
      if (!validation.success) {
        console.error(`[ApiFortniteProvider] Validation failed:`, validation.error.errors)
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Response validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`,
            provider: this.name,
          },
        }
      }

      return {
        success: true,
        data: validation.data,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[ApiFortniteProvider] Fetch failed:`, message)

      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message,
          provider: this.name,
        },
      }
    }
  }

  private async fetchBattlePass(): Promise<NormalizedShopEntry | null> {
    try {
      console.log(`[ApiFortniteProvider] Fetching Battle Pass...`)
      const bp = await this.client.battlepass.getBattlePass(this.language)

      // Try to extract image from battlePassContent or battlePassOffers
      let imageUrl: string | null = null
      let name = 'Pase de Batalla'

      // Try battlePassContent.news.messages[0].image
      const messages = (bp as any)?.battlePassContent?.news?.messages
      if (messages?.length > 0 && messages[0].image) {
        imageUrl = messages[0].image
      }

      // Fallback: try battlePassOffers[0].offerVisual
      if (!imageUrl && bp.battlePassOffers?.length > 0) {
        imageUrl = bp.battlePassOffers[0].offerVisual || null
      }

      // Try to extract name from battlePassOffers
      if (bp.battlePassOffers?.length > 0 && bp.battlePassOffers[0].title) {
        name = bp.battlePassOffers[0].title
      }

      console.log(`[ApiFortniteProvider] Battle Pass image: ${imageUrl || 'null'}`)

      return {
        fortniteProductId: SPECIAL_PRODUCT_IDS.BATTLE_PASS,
        name,
        slug: normalizeSlug(name),
        description: 'Pase de Batalla de Fortnite',
        type: 'BATTLE_PASS',
        rarity: 'LEGENDARY',
        series: null,
        priceVbucks: 950,
        imageUrl,
        iconUrl: imageUrl,
        featuredImageUrl: null,
        giftable: 'NOT_GIFTABLE',
        section: null,
        layoutId: null,
        offerId: null,
        bundleInfo: null,
      }
    } catch (error) {
      console.error(`[ApiFortniteProvider] Battle Pass fetch error (non-fatal):`, error)
      return null
    }
  }

  private async fetchCrew(): Promise<NormalizedShopEntry | null> {
    try {
      console.log(`[ApiFortniteProvider] Fetching Crew...`)
      const crew = await this.client.crew.getCurrent()

      let imageUrl: string | null = null
      let name = 'Fortnite Crew'

      // Try to extract from crew catalogEntries
      const crewData = (crew as any)?.data?.crew
      if (crewData?.catalogEntries?.length > 0) {
        const entry = crewData.catalogEntries[0]

        // Try offerVisual first
        if (entry.offerVisual) {
          imageUrl = entry.offerVisual
        }

        // Try itemGrants[0].cosmetic.images.icon
        if (!imageUrl && entry.itemGrants?.length > 0) {
          imageUrl = entry.itemGrants[0].cosmetic?.images?.icon || null
        }

        // Use entry title for name
        if (entry.title) {
          name = entry.title
        }
      }

      console.log(`[ApiFortniteProvider] Crew image: ${imageUrl || 'null'}`)

      return {
        fortniteProductId: SPECIAL_PRODUCT_IDS.CREW,
        name,
        slug: normalizeSlug(name),
        description: 'Suscripción Fortnite Crew',
        type: 'CREW',
        rarity: 'ICON_SERIES',
        series: null,
        priceVbucks: 1950,
        imageUrl,
        iconUrl: imageUrl,
        featuredImageUrl: null,
        giftable: 'NOT_GIFTABLE',
        section: null,
        layoutId: null,
        offerId: null,
        bundleInfo: null,
      }
    } catch (error) {
      console.error(`[ApiFortniteProvider] Crew fetch error (non-fatal):`, error)
      return null
    }
  }

  private normalizeResponse(
    shop: any,
    battlePassProduct: NormalizedShopEntry | null,
    crewProduct: NormalizedShopEntry | null,
  ): NormalizedShop {
    const entries: NormalizedShopEntry[] = []
    const specialProducts: NormalizedShopEntry[] = []
    const seenItemKeys = new Set<string>()

    // Process shop entries
    for (const storefront of shop.storefronts) {
      for (const catalogEntry of storefront.catalogEntries) {
        // Detect DLC offers (Battle Pass bundles, level bundles, starter packs) without itemGrants
        const metaInfo = (catalogEntry as any).metaInfo
        const isDlcOffer = metaInfo && (
          metaInfo.IsBattlePass === 'true' ||
          metaInfo.IsLevelBundle === 'true' ||
          metaInfo.LayoutId?.startsWith('BattlePassCrew')
        )
        if (isDlcOffer && (!catalogEntry.itemGrants || catalogEntry.itemGrants.length === 0)) {
          const mtxPrice = catalogEntry.prices?.find((p: any) => p.currencyType === 'RealMoney')
          const priceMxn = mtxPrice?.finalPrice || mtxPrice?.regularPrice || 0
          specialProducts.push({
            fortniteProductId: `dlc-${catalogEntry.offerId || 'unknown'}`,
            name: catalogEntry.title || 'Pase / DLC',
            slug: normalizeSlug(catalogEntry.title || 'pase-dlc'),
            description: catalogEntry.description || null,
            type: 'DLC',
            rarity: 'UNCOMMON',
            series: null,
            priceVbucks: 0,
            imageUrl: (catalogEntry as any).offerVisual || null,
            iconUrl: (catalogEntry as any).offerVisual || null,
            featuredImageUrl: null,
            giftable: 'NOT_GIFTABLE',
            section: 'Pases, Crew y DLC',
            layoutId: metaInfo.LayoutId || null,
            offerId: catalogEntry.offerId || null,
            bundleInfo: null,
            priceMxn,
          })
          continue
        }

        if (!catalogEntry.itemGrants || catalogEntry.itemGrants.length === 0) continue

        // Check if this is a V-Bucks entry
        if (isVBucksEntry(catalogEntry)) {
          const vbucksEntry = this.normalizeVBucksEntry(catalogEntry)
          if (vbucksEntry) {
            specialProducts.push(vbucksEntry)
          }
          continue
        }

        const isBundle = catalogEntry.itemGrants.length > 1 || Boolean(catalogEntry.bundle)
        const section = catalogEntry.sectionDisplayName || (catalogEntry as any).layout?.name || storefront.name || null
        const layoutId = (catalogEntry as any).layout?.id || null
        const offerId = catalogEntry.offerId || null

        const vBucksPrice = catalogEntry.prices?.find(
          (p: any) => p.currencyType === 'MtxCurrency'
        )
        const priceVbucks = vBucksPrice?.finalPrice || vBucksPrice?.regularPrice || 0

        const bundleInfo = catalogEntry.bundle ? {
          name: catalogEntry.bundle.name || catalogEntry.title || 'Bundle',
          info: catalogEntry.bundle.info || 'Bundle',
          image: catalogEntry.itemGrants[0]?.cosmetic?.images?.icon || '',
        } : null

        for (const itemGrant of catalogEntry.itemGrants) {
          const itemKey = `${offerId ?? 'no-offer'}|${itemGrant.templateId}`
          if (seenItemKeys.has(itemKey)) continue
          seenItemKeys.add(itemKey)

          const cosmetic = itemGrant.cosmetic
          if (!cosmetic) continue

          const productType = resolveType(cosmetic.type)
          const templateId = extractTemplateId(itemGrant.templateId)

          entries.push({
            fortniteProductId: templateId,
            name: cosmetic.name || cosmetic.displayName,
            slug: normalizeSlug(cosmetic.name || cosmetic.displayName),
            description: cosmetic.description || null,
            type: productType,
            rarity: resolveRarity(cosmetic.rarity),
            series: cosmetic.set?.value || null,
            priceVbucks,
            imageUrl: cosmetic.images?.icon || null,
            iconUrl: cosmetic.images?.icon || null,
            featuredImageUrl: cosmetic.images?.largeIcon || null,
            giftable: resolveGiftability(productType),
            section,
            layoutId,
            offerId,
            bundleInfo,
          })
        }
      }
    }

    // Synthesize V-Bucks denominations as special products (always available)
    const VBucksDenominations = [
      { id: SPECIAL_PRODUCT_IDS.VBucks_1000, amount: 1000 },
      { id: SPECIAL_PRODUCT_IDS.VBucks_2800, amount: 2800 },
      { id: SPECIAL_PRODUCT_IDS.VBucks_5000, amount: 5000 },
      { id: SPECIAL_PRODUCT_IDS.VBucks_13500, amount: 13500 },
    ]
    for (const vb of VBucksDenominations) {
      specialProducts.push({
        fortniteProductId: vb.id,
        name: `${vb.amount.toLocaleString('es-MX')} V-Bucks`,
        slug: normalizeSlug(`${vb.amount} vbucks`),
        description: `${vb.amount} V-Bucks para usar en Fortnite`,
        type: 'VBucks',
        rarity: 'UNCOMMON',
        series: null,
        priceVbucks: vb.amount,
        imageUrl: null,
        iconUrl: null,
        featuredImageUrl: null,
        giftable: 'NOT_GIFTABLE',
        section: 'V-Bucks',
        layoutId: null,
        offerId: null,
        bundleInfo: null,
      })
    }

    // Add Battle Pass and Crew products if fetched successfully
    if (battlePassProduct) {
      specialProducts.push(battlePassProduct)
    }
    if (crewProduct) {
      specialProducts.push(crewProduct)
    }

    const checksum = computeChecksum(shop)

    return {
      entries,
      specialProducts,
      shopDate: new Date().toISOString(),
      checksum,
      provider: this.name,
      providerVersion: this.version,
    }
  }

  private normalizeVBucksEntry(catalogEntry: any): NormalizedShopEntry | null {
    // Find the Currency: templateId to determine amount
    for (const grant of catalogEntry.itemGrants || []) {
      if (grant.templateId?.toLowerCase().startsWith('currency:')) {
        const productId = extractVBucksProductId(grant.templateId)
        if (productId) {
          // Extract amount from product ID
          const amountMatch = productId.match(/(\d+)/)
          const amount = amountMatch ? parseInt(amountMatch[1], 10) : 0

          // Get price from offer
          const mtxPrice = catalogEntry.prices?.find((p: any) => p.currencyType === 'RealMoney')
          const priceMxn = mtxPrice?.finalPrice || mtxPrice?.regularPrice || 0

          return {
            fortniteProductId: productId,
            name: `${amount.toLocaleString('es-MX')} V-Bucks`,
            slug: normalizeSlug(`${amount} vbucks`),
            description: `${amount} V-Bucks para usar en Fortnite`,
            type: 'VBucks',
            rarity: 'UNCOMMON',
            series: null,
            priceVbucks: amount,
            imageUrl: catalogEntry.offerVisual || null,
            iconUrl: catalogEntry.offerVisual || null,
            featuredImageUrl: null,
            giftable: 'NOT_GIFTABLE',
            section: null,
            layoutId: null,
            offerId: catalogEntry.offerId || null,
            bundleInfo: null,
          }
        }
      }
    }
    return null
  }
}
