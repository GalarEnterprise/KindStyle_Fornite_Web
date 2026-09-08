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

export class ApiFortniteProvider implements CatalogProvider {
  name = 'api-fortnite'
  version = '9.0.0'

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

      const normalizedShop = this.normalizeResponse(shop)

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

  private normalizeResponse(shop: any): NormalizedShop {
    const entries: NormalizedShopEntry[] = []
    const seenItemKeys = new Set<string>()

    for (const storefront of shop.storefronts) {
      for (const catalogEntry of storefront.catalogEntries) {
        if (!catalogEntry.itemGrants || catalogEntry.itemGrants.length === 0) continue

        const isBundle = catalogEntry.itemGrants.length > 1 || Boolean(catalogEntry.bundle)
        const section = storefront.name || catalogEntry.sectionDisplayName || null
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
            layoutId: null,
            offerId,
            bundleInfo,
          })
        }
      }
    }

    const checksum = computeChecksum(shop)

    return {
      entries,
      shopDate: new Date().toISOString(),
      checksum,
      provider: this.name,
      providerVersion: this.version,
    }
  }
}