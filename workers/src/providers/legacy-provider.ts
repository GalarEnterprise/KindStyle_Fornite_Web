import { createHash } from 'crypto'
import type { CatalogProvider, NormalizedShop, ProviderResult, NormalizedShopEntry } from './types'

interface FortniteShopItem {
  id: string
  name: string
  description: string
  type: { value: string; displayValue: string }
  rarity: { value: string; displayValue: string } | null
  series: { value: string; displayValue: string } | null
  images: { icon?: string; featured?: string; smallIcon?: string; largeIcon?: string }
  gameplayTags: string[]
  showcaseVideo: string | null
  variants: unknown[]
  banner: string | null
}

interface FortniteShopEntry {
  regularPrice: number
  finalPrice: number
  colors: Record<string, string> | null
  items: FortniteShopItem[]
  granted: unknown[]
  layout?: { id: string; name: string }
  offerId?: string
  bundle?: { name: string; info: string; image: string }
  brItems?: FortniteShopItem[]
  newDisplayAsset?: {
    id: string
    materialInstances: Array<{ images: Record<string, string> }>
    renderImages?: Array<{ image?: string } | null>
  }
}

interface FortniteShopResponse {
  status: number
  data: {
    hash: string
    date: string
    shopHistory: string[]
    entries: FortniteShopEntry[]
  }
}

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
}

const RARITY_MAP: Record<string, string> = {
  'Common': 'COMMON',
  'Uncommon': 'UNCOMMON',
  'Rare': 'RARE',
  'Epic': 'EPIC',
  'Legendary': 'LEGENDARY',
  'Mythic': 'MYTHIC',
  'Exotic': 'EXOTIC',
  'IconSeries': 'ICON_SERIES',
  'StarWarsSeries': 'STAR_WARS',
  'DCSeries': 'DC',
  'MarvelSeries': 'MARVEL',
  'GamingLegends': 'GAMING_LEGENDS',
  'LavaSeries': 'LAVA',
  'FrozenSeries': 'FROZEN',
  'ShadowSeries': 'SHADOW',
  'SlurpSeries': 'SLURP',
  'DarkSeries': 'DARK',
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
  return RARITY_MAP[value] || null
}

function computeChecksum(payload: unknown): string {
  const serialized = JSON.stringify(payload, Object.keys(payload as object).sort())
  return createHash('sha256').update(serialized).digest('hex')
}

export class LegacyFortniteProvider implements CatalogProvider {
  name = 'legacy'
  version = '1.0.0'

  private apiKey: string
  private baseUrl: string
  private timeout: number
  private language: string

  constructor(config: {
    apiKey: string
    baseUrl?: string
    timeout?: number
    language?: string
  }) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://fortnite-api.com'
    this.timeout = config.timeout || 30000
    this.language = config.language || 'es'
  }

  async fetchShop(): Promise<ProviderResult> {
    try {
      const url = `${this.baseUrl}/v2/shop?language=${this.language}`
      console.log(`[LegacyProvider] Fetching shop from ${url}`)

      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const body = await response.json() as FortniteShopResponse

      if (body.status !== 200) {
        throw new Error(`API returned status ${body.status}`)
      }

      console.log(`[LegacyProvider] Fetched ${body.data.entries.length} entries`)

      const normalizedShop = this.normalizeResponse(body)

      return {
        success: true,
        data: normalizedShop,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[LegacyProvider] Fetch failed:`, message)

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

  private normalizeResponse(response: FortniteShopResponse): NormalizedShop {
    const entries: NormalizedShopEntry[] = []
    const seenLooseItemKeys = new Set<string>()
    const seenBundleItemKeys = new Set<string>()

    for (const entry of response.data.entries) {
      const entryItems = entry.brItems ?? entry.items
      if (!entryItems || entryItems.length === 0) continue

      const isBundle = entryItems.length > 1 || Boolean(entry.bundle)
      const section = entry.layout?.name || null
      const layoutId = entry.layout?.id || null
      const offerId = entry.offerId || null
      const bundleInfo = entry.bundle || (entryItems.length > 1
        ? {
            name: `${entryItems[0].name} y más`,
            info: 'Bundle',
            image: entryItems[0].images?.featured || entryItems[0].images?.icon || '',
          }
        : null)

      for (const item of entryItems) {
        if (isBundle) {
          const bundleKey = `${offerId ?? 'no-offer'}|${item.id}`
          if (seenBundleItemKeys.has(bundleKey)) continue
          seenBundleItemKeys.add(bundleKey)
        } else {
          if (seenLooseItemKeys.has(item.id)) continue
          seenLooseItemKeys.add(item.id)
        }

        const productType = resolveType(item.type?.value)
        entries.push({
          fortniteProductId: item.id,
          name: item.name,
          slug: normalizeSlug(item.name),
          description: item.description || null,
          type: productType,
          rarity: resolveRarity(item.rarity?.value),
          series: item.series?.value || null,
          priceVbucks: entry.finalPrice || entry.regularPrice || 0,
          imageUrl: item.images?.featured || item.images?.icon || null,
          iconUrl: item.images?.icon || null,
          featuredImageUrl: item.images?.featured || null,
          giftable: resolveGiftability(productType),
          section,
          layoutId,
          offerId,
          bundleInfo,
        })
      }
    }

    const checksum = computeChecksum(response.data)

    return {
      entries,
      shopDate: response.data.date,
      checksum,
      provider: this.name,
      providerVersion: this.version,
    }
  }
}