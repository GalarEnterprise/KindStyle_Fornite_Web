import { z } from 'zod'

export interface NormalizedShopEntry {
  fortniteProductId: string
  name: string
  slug: string
  description: string | null
  type: string
  rarity: string | null
  series: string | null
  priceVbucks: number
  imageUrl: string | null
  iconUrl: string | null
  featuredImageUrl: string | null
  giftable: 'GIFTABLE' | 'NOT_GIFTABLE' | 'UNKNOWN'
  section: string | null
  layoutId: string | null
  offerId: string | null
  bundleInfo: { name: string; info: string; image: string } | null
}

export interface NormalizedShop {
  entries: NormalizedShopEntry[]
  shopDate: string
  checksum: string
  provider: string
  providerVersion: string
}

export interface ProviderResult {
  success: boolean
  data?: NormalizedShop
  error?: {
    code: string
    message: string
    provider: string
  }
}

export interface CatalogProvider {
  name: string
  version: string
  fetchShop(): Promise<ProviderResult>
}

export const NormalizedShopEntrySchema = z.object({
  fortniteProductId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  rarity: z.string().nullable(),
  series: z.string().nullable(),
  priceVbucks: z.number(),
  imageUrl: z.string().nullable(),
  iconUrl: z.string().nullable(),
  featuredImageUrl: z.string().nullable(),
  giftable: z.enum(['GIFTABLE', 'NOT_GIFTABLE', 'UNKNOWN']),
  section: z.string().nullable(),
  layoutId: z.string().nullable(),
  offerId: z.string().nullable(),
  bundleInfo: z.object({
    name: z.string(),
    info: z.string(),
    image: z.string(),
  }).nullable(),
})

export const NormalizedShopSchema = z.object({
  entries: z.array(NormalizedShopEntrySchema),
  shopDate: z.string(),
  checksum: z.string(),
  provider: z.string(),
  providerVersion: z.string(),
})