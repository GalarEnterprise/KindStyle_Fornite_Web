export type { CatalogProvider, NormalizedShop, ProviderResult, NormalizedShopEntry } from './types'
export { NormalizedShopSchema, NormalizedShopEntrySchema } from './types'
export { LegacyFortniteProvider } from './legacy-provider'
export { ApiFortniteProvider } from './api-fortnite-provider'
export { ShadowProvider } from './shadow-provider'

import type { CatalogProvider } from './types'
import { LegacyFortniteProvider } from './legacy-provider'
import { ApiFortniteProvider } from './api-fortnite-provider'
import { ShadowProvider } from './shadow-provider'

export type CatalogProviderType = 'legacy' | 'api-fortnite'

export function createProvider(type?: CatalogProviderType): CatalogProvider {
  const providerType = type || (process.env.CATALOG_PROVIDER as CatalogProviderType) || 'legacy'
  const shadowMode = process.env.CATALOG_SHADOW === 'true'

  let primary: CatalogProvider
  if (providerType === 'api-fortnite') {
    primary = createApiFortniteProvider()
  } else if (providerType === 'legacy') {
    primary = createLegacyProvider()
  } else {
    console.warn(`[CatalogProvider] Invalid CATALOG_PROVIDER: ${providerType}, using legacy`)
    primary = createLegacyProvider()
  }

  if (shadowMode) {
    const secondary = providerType === 'api-fortnite'
      ? createLegacyProvider()
      : createApiFortniteProvider()

    return new ShadowProvider(primary, secondary)
  }

  return primary
}

function createLegacyProvider(): LegacyFortniteProvider {
  const apiKey = process.env.FORTNITE_API_KEY || process.env.LEGACY_FORTNITE_API_KEY
  if (!apiKey) {
    throw new Error('FORTNITE_API_KEY (or LEGACY_FORTNITE_API_KEY) is required for legacy provider')
  }

  return new LegacyFortniteProvider({
    apiKey,
    baseUrl: process.env.FORTNITE_API_URL || process.env.LEGACY_FORNITE_URL,
    timeout: parseInt(process.env.FORTNITE_API_TIMEOUT || '30000'),
    language: process.env.FORTNITE_API_LANGUAGE || 'es',
  })
}

function createApiFortniteProvider(): ApiFortniteProvider {
  const apiKey = process.env.API_FORTNITE_API_KEY
  if (!apiKey) {
    throw new Error('API_FORTNITE_API_KEY is required for api-fortnite provider')
  }

  return new ApiFortniteProvider({
    apiKey,
    baseUrl: process.env.API_FORTNITE_BASE_URL || process.env.API_FORNITE_URL,
    timeout: parseInt(process.env.FORTNITE_API_TIMEOUT || '30000'),
    language: process.env.FORTNITE_API_LANGUAGE || 'es',
  })
}

export function isShadowMode(): boolean {
  return process.env.CATALOG_SHADOW === 'true'
}