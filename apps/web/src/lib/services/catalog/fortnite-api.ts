export interface FortniteShopItem {
  id: string
  name: string
  description: string
  type: {
    value: string
    displayValue: string
  }
  rarity: {
    value: string
    displayValue: string
  } | null
  series: {
    value: string
    displayValue: string
  } | null
  set: {
    value: string
    displayValue: string
    id: string
  } | null
  introduction: {
    chapter: string
    season: string
    text: string
  } | null
  images: {
    icon?: string
    featured?: string
    smallIcon?: string
    largeIcon?: string
    background?: string
    fullBackground?: string
  }
  gameplayTags: string[]
  showcaseVideo: string | null
  variants: Array<{
    channel: string
    type: string
    options: Array<{
      tag: string
      image?: string
    }>
  }>
  banner: string | null
  colors: {
    background?: string
    textColor?: string
    sectionBackground?: string
  } | null
  displayAssetPath?: string
  definition?: string
  newDisplayAsset?: {
    id: string
    materialInstances: Array<{
      images: Record<string, string>
    }>
  }
}

export interface FortniteShopEntry {
  regularPrice: number
  finalPrice: number
  colors: {
    background?: string
    textColor?: string
    sectionBackground?: string
  } | null
  displayAssetPath?: string
  definition?: string
  newDisplayAsset?: {
    id: string
    materialInstances: Array<{
      images: Record<string, string>
    }>
  }
  items: FortniteShopItem[]
  granted: unknown[]
}

export interface FortniteShopResponse {
  status: number
  data: {
    hash: string
    date: string
    shopHistory: string[]
    entries: FortniteShopEntry[]
  }
}

export class FortniteApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public url?: string
  ) {
    super(message)
    this.name = 'FortniteApiError'
  }
}

export interface FortniteApiClientConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
  language?: string
}

const DEFAULT_BASE_URL = 'https://fortnite-api.com'
const DEFAULT_TIMEOUT = 30000
const DEFAULT_LANGUAGE = 'es'

export class FortniteApiClient {
  private apiKey: string
  private baseUrl: string
  private timeout: number
  private language: string

  constructor(config: FortniteApiClientConfig) {
    if (!config.apiKey) {
      throw new Error('FORTNITE_API_KEY is required')
    }

    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL
    this.timeout = config.timeout || DEFAULT_TIMEOUT
    this.language = config.language || DEFAULT_LANGUAGE
  }

  async fetchShop(language?: string): Promise<FortniteShopResponse> {
    const url = new URL('/v2/shop', this.baseUrl)
    url.searchParams.set('language', language || this.language)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      console.log(`[FortniteAPI] Fetching shop from ${url.toString()}`)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new FortniteApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url.toString()
        )
      }

      const data = await response.json()

      if (data.status !== 200) {
        throw new FortniteApiError(
          `API returned status ${data.status}`,
          data.status,
          url.toString()
        )
      }

      console.log(`[FortniteAPI] Shop fetched successfully. Hash: ${data.data.hash}`)
      console.log(`[FortniteAPI] Entries count: ${data.data.entries.length}`)

      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof FortniteApiError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new FortniteApiError(
            `Request timeout after ${this.timeout}ms`,
            undefined,
            url.toString()
          )
        }

        throw new FortniteApiError(
          `Network error: ${error.message}`,
          undefined,
          url.toString()
        )
      }

      throw new FortniteApiError('Unknown error', undefined, url.toString())
    }
  }
}

export function createFortniteApiClient(): FortniteApiClient {
  const apiKey = process.env.FORTNITE_API_KEY

  if (!apiKey) {
    throw new Error('FORTNITE_API_KEY environment variable is not set')
  }

  return new FortniteApiClient({
    apiKey,
    baseUrl: process.env.FORTNITE_API_URL || DEFAULT_BASE_URL,
    timeout: parseInt(process.env.FORTNITE_API_TIMEOUT || String(DEFAULT_TIMEOUT)),
    language: process.env.FORTNITE_API_LANGUAGE || DEFAULT_LANGUAGE,
  })
}
