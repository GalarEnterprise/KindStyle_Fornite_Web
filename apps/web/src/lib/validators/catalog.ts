import { z } from 'zod'

const ProductType = z.enum([
  'OUTFIT',
  'BACK_BLING',
  'PICKAXE',
  'GLIDER',
  'EMOTE',
  'WRAP',
  'MUSIC_PACK',
  'LOADING_SCREEN',
  'SPRAY',
  'CONTRAIL',
  'TOY',
  'BANNER',
  'VBucks',
  'BATTLE_PASS',
  'CREW',
  'BUNDLE',
  'OTHER',
])

const Rarity = z.enum([
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
  'EXOTIC',
  'ICON_SERIES',
  'STAR_WARS',
  'DC',
  'MARVEL',
  'GAMING_LEGENDS',
  'LAVA',
  'FROZEN',
  'SHADOW',
  'SLURP',
  'DARK',
  'BRIGHT',
  'BEYOND',
])

const GiftabilityStatus = z.enum(['GIFTABLE', 'NOT_GIFTABLE', 'UNKNOWN'])

export const ProductSchema = z.object({
  id: z.string().uuid(),
  internal_sku: z.string(),
  fortnite_product_id: z.string(),
  fortnite_offer_id: z.string().nullable(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  type: ProductType,
  subcategory: z.string().nullable(),
  rarity: Rarity.nullable(),
  series: z.string().nullable(),
  price_vbucks: z.number().int().positive(),
  image_url: z.string().url().nullable(),
  icon_url: z.string().url().nullable(),
  featured_image_url: z.string().url().nullable(),
  banner_url: z.string().url().nullable(),
  giftable: GiftabilityStatus,
  active: z.boolean(),
  visible: z.boolean(),
  admin_price_mxn: z.number().nullable(),
  first_seen_at: z.date().nullable(),
  last_seen_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const ShopItemSchema = z.object({
  id: z.string().uuid(),
  shop_snapshot_id: z.string().uuid(),
  product_id: z.string().uuid(),
  price_vbucks: z.number().int().positive(),
  display_order: z.number().int(),
  section: z.string().nullable(),
  featured: z.boolean(),
  created_at: z.date(),
})

export const ShopSnapshotSchema = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  fetched_at: z.date(),
  shop_date: z.date(),
  raw_payload: z.unknown(),
  checksum: z.string(),
  created_at: z.date(),
})

export const ProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  type: ProductType.optional(),
  rarity: Rarity.optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
})

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
})

export type Product = z.infer<typeof ProductSchema>
export type ShopItem = z.infer<typeof ShopItemSchema>
export type ShopSnapshot = z.infer<typeof ShopSnapshotSchema>
export type ProductsQuery = z.infer<typeof ProductsQuerySchema>
export type SearchQuery = z.infer<typeof SearchQuerySchema>
