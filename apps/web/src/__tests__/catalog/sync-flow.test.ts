import { describe, it, expect } from 'vitest'
import { normalizeSlug, resolveProductType, resolveRarity, normalizeShopEntry } from '@/lib/services/catalog/shop-normalizer'
import { resolveGiftability } from '@/lib/services/catalog/giftability-engine'
import type { FortniteShopEntry } from '@/lib/services/catalog/fortnite-api'

describe('normalizeSlug', () => {
  it('converts name to kebab-case slug', () => {
    expect(normalizeSlug('Spider-Man')).toBe('spider-man')
    expect(normalizeSlug('Renegade Raider')).toBe('renegade-raider')
    expect(normalizeSlug('Dr. Doom')).toBe('dr-doom')
  })

  it('handles special characters and accents', () => {
    expect(normalizeSlug('Café Outfit')).toBe('cafe-outfit')
    expect(normalizeSlug('Niño')).toBe('nino')
  })

  it('removes leading and trailing dashes', () => {
    expect(normalizeSlug('--test--')).toBe('test')
  })
})

describe('resolveProductType', () => {
  it('maps known types', () => {
    expect(resolveProductType('outfit')).toBe('OUTFIT')
    expect(resolveProductType('emote')).toBe('EMOTE')
    expect(resolveProductType('backbling')).toBe('BACK_BLING')
    expect(resolveProductType('pickaxe')).toBe('PICKAXE')
  })

  it('returns OTHER for unknown types', () => {
    expect(resolveProductType('unknown')).toBe('OTHER')
    expect(resolveProductType(undefined)).toBe('OTHER')
  })
})

describe('resolveRarity', () => {
  it('maps known rarities', () => {
    expect(resolveRarity('Epic')).toBe('EPIC')
    expect(resolveRarity('Legendary')).toBe('LEGENDARY')
    expect(resolveRarity('Rare')).toBe('RARE')
    expect(resolveRarity('IconSeries')).toBe('ICON_SERIES')
  })

  it('returns null for unknown or missing rarity', () => {
    expect(resolveRarity('unknown')).toBe(null)
    expect(resolveRarity(undefined)).toBe(null)
  })
})

describe('resolveGiftability', () => {
  it('returns NOT_GIFTABLE for non-giftable types', () => {
    expect(resolveGiftability('VBucks')).toBe('NOT_GIFTABLE')
    expect(resolveGiftability('BATTLE_PASS')).toBe('NOT_GIFTABLE')
    expect(resolveGiftability('CREW')).toBe('NOT_GIFTABLE')
  })

  it('returns UNKNOWN for bundles', () => {
    expect(resolveGiftability('BUNDLE')).toBe('UNKNOWN')
  })

  it('returns GIFTABLE for regular cosmetics', () => {
    expect(resolveGiftability('OUTFIT')).toBe('GIFTABLE')
    expect(resolveGiftability('EMOTE')).toBe('GIFTABLE')
    expect(resolveGiftability('PICKAXE')).toBe('GIFTABLE')
    expect(resolveGiftability('GLIDER')).toBe('GIFTABLE')
  })
})

describe('normalizeShopEntry', () => {
  it('normalizes a single-item entry (outfit)', () => {
    const entry: FortniteShopEntry = {
      regularPrice: 1500,
      finalPrice: 1500,
      colors: null,
      items: [
        {
          id: 'CID_123',
          name: 'Spider-Man',
          description: 'With great power...',
          type: { value: 'outfit', displayValue: 'Outfit' },
          rarity: { value: 'Epic', displayValue: 'Epic' },
          series: null,
          set: null,
          introduction: null,
          images: { icon: 'https://img.example.com/icon.png', featured: 'https://img.example.com/featured.png' },
          colors: null,
          gameplayTags: [],
          showcaseVideo: null,
          variants: [],
          banner: null,
        },
      ],
      granted: [],
    }

    const result = normalizeShopEntry(entry)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Spider-Man')
    expect(result[0].type).toBe('OUTFIT')
    expect(result[0].rarity).toBe('EPIC')
    expect(result[0].priceVbucks).toBe(1500)
    expect(result[0].giftable).toBe('GIFTABLE')
    expect(result[0].imageUrl).toBe('https://img.example.com/featured.png')
  })

  it('normalizes a bundle entry (multiple items)', () => {
    const entry: FortniteShopEntry = {
      regularPrice: 2500,
      finalPrice: 2000,
      colors: null,
      items: [
        {
          id: 'CID_001',
          name: 'Hero',
          description: '',
          type: { value: 'outfit', displayValue: 'Outfit' },
          rarity: { value: 'Epic', displayValue: 'Epic' },
          series: null,
          set: null,
          introduction: null,
          images: { icon: 'https://img.example.com/icon.png' },
          colors: null,
          gameplayTags: [],
          showcaseVideo: null,
          variants: [],
          banner: null,
        },
        {
          id: 'BID_001',
          name: 'Back Bling',
          description: '',
          type: { value: 'backbling', displayValue: 'Back Bling' },
          rarity: null,
          series: null,
          set: null,
          introduction: null,
          images: { icon: 'https://img.example.com/icon2.png' },
          colors: null,
          gameplayTags: [],
          showcaseVideo: null,
          variants: [],
          banner: null,
        },
      ],
      granted: [],
    }

    const result = normalizeShopEntry(entry)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Hero Bundle')
    expect(result[0].type).toBe('BUNDLE')
    expect(result[0].giftable).toBe('UNKNOWN')
    expect(result[0].priceVbucks).toBe(2000)
  })

  it('returns empty array for entries with no items', () => {
    const entry: FortniteShopEntry = {
      regularPrice: 0,
      finalPrice: 0,
      colors: null,
      items: [],
      granted: [],
    }

    expect(normalizeShopEntry(entry)).toHaveLength(0)
  })
})

describe('Checksum comparison', () => {
  it('produces different checksums for different payloads', async () => {
    const { createHash } = await import('crypto')

    const computeChecksum = (payload: unknown) => {
      const serialized = JSON.stringify(payload, Object.keys(payload as object).sort())
      return createHash('sha256').update(serialized).digest('hex')
    }

    const checksum1 = computeChecksum({ date: '2026-08-24', entries: [1, 2, 3] })
    const checksum2 = computeChecksum({ date: '2026-08-25', entries: [1, 2, 3, 4] })
    const checksum3 = computeChecksum({ date: '2026-08-24', entries: [1, 2, 3] })

    expect(checksum1).not.toBe(checksum2)
    expect(checksum1).toBe(checksum3)
  })
})
