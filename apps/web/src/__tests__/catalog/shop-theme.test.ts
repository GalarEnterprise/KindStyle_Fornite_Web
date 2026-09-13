import { describe, it, expect } from 'vitest'
import {
  extractEntryTheme,
  isShopEntryTheme,
  parseShopEntryTheme,
  normalizeHexColor,
  isAllowedImageHost,
} from '@kindstyle/shared'
import type { ShopThemeSourceEntry } from '@kindstyle/shared'

describe('normalizeHexColor', () => {
  it('accepts 6 and 8 digit hex with or without hash', () => {
    expect(normalizeHexColor('f86b71ff')).toBe('#f86b71ff')
    expect(normalizeHexColor('#ff0000')).toBe('#ff0000')
    expect(normalizeHexColor('  RED ')).toBeUndefined()
  })

  it('rejects non-strings and malformed values', () => {
    expect(normalizeHexColor(undefined)).toBeUndefined()
    expect(normalizeHexColor(null)).toBeUndefined()
    expect(normalizeHexColor(12345)).toBeUndefined()
    expect(normalizeHexColor('zzzzzz')).toBeUndefined()
    expect(normalizeHexColor('#fff')).toBeUndefined()
  })
})

describe('isAllowedImageHost', () => {
  it('accepts https URLs on whitelisted domains', () => {
    expect(
      isAllowedImageHost('https://fortnite-api.com/images/banners/x/icon.png')
    ).toBe(true)
    expect(isAllowedImageHost('https://cdn2.epicgames.com/img.png')).toBe(true)
  })

  it('rejects non-https and non-whitelisted hosts', () => {
    expect(isAllowedImageHost('http://fortnite-api.com/a.png')).toBe(false)
    expect(isAllowedImageHost('https://evil.com/a.png')).toBe(false)
    expect(isAllowedImageHost('https://fortnite-api.com.evil.io/a.png')).toBe(false)
    expect(isAllowedImageHost(null)).toBe(false)
    expect(isAllowedImageHost('not a url')).toBe(false)
  })
})

describe('isShopEntryTheme / parseShopEntryTheme', () => {
  it('accepts objects with string theme fields only', () => {
    expect(isShopEntryTheme({ color1: '#f86b71ff', tileImage: 'https://x' })).toBe(true)
    expect(parseShopEntryTheme({ color1: '#aaaaaa' })).toEqual({ color1: '#aaaaaa' })
  })

  it('rejects non-objects and wrong field types', () => {
    expect(isShopEntryTheme(null)).toBe(false)
    expect(isShopEntryTheme('theme')).toBe(false)
    expect(isShopEntryTheme([1, 2])).toBe(false)
    expect(isShopEntryTheme({ color1: 42 })).toBe(false)
    expect(parseShopEntryTheme('nope')).toBeNull()
    expect(parseShopEntryTheme(null)).toBeNull()
  })

  it('treats unknown extra keys as valid (forward compatible)', () => {
    expect(isShopEntryTheme({ color1: '#112233', brandNew: 'x' })).toBe(true)
  })
})

describe('extractEntryTheme', () => {
  it('extracts colors and OfferImage tile from a realistic entry', () => {
    const entry: ShopThemeSourceEntry = {
      colors: {
        color1: 'f86b71ff',
        color2: '012743ff',
        color3: 'ffa9a5ff',
        textBackgroundColor: '784042ff',
      },
      newDisplayAsset: {
        materialInstances: [{ images: { OfferImage: 'https://fortnite-api.com/images/shop/a.png' } }],
      },
    }

    expect(extractEntryTheme(entry)).toEqual({
      color1: '#f86b71ff',
      color2: '#012743ff',
      color3: '#ffa9a5ff',
      textBackgroundColor: '#784042ff',
      tileImage: 'https://fortnite-api.com/images/shop/a.png',
    })
  })

  it('falls back to any whitelisted image when OfferImage is missing', () => {
    const entry: ShopThemeSourceEntry = {
      newDisplayAsset: {
        materialInstances: [
          { images: { Background: 'https://cdn2.epicgames.com/bg.png' } },
        ],
      },
    }

    expect(extractEntryTheme(entry)).toEqual({ tileImage: 'https://cdn2.epicgames.com/bg.png' })
  })

  it('falls back to renderImages when materialInstances is empty (current API shape)', () => {
    const entry: ShopThemeSourceEntry = {
      newDisplayAsset: {
        materialInstances: [],
        renderImages: [
          { image: 'https://fortnite-api.com/images/cosmetics/br/newdisplayassets/abc/renderimage_0.png' },
        ],
      },
    }

    expect(extractEntryTheme(entry)).toEqual({
      tileImage: 'https://fortnite-api.com/images/cosmetics/br/newdisplayassets/abc/renderimage_0.png',
    })
  })

  it('drops invalid colors and non-whitelisted image URLs', () => {
    const entry: ShopThemeSourceEntry = {
      colors: { color1: 'nothex', color3: undefined },
      newDisplayAsset: {
        materialInstances: [{ images: { OfferImage: 'https://evil.com/x.png' } }],
      },
    }

    expect(extractEntryTheme(entry)).toBeNull()
  })

  it('returns null for empty or missing entry', () => {
    expect(extractEntryTheme(null)).toBeNull()
    expect(extractEntryTheme(undefined)).toBeNull()
    expect(extractEntryTheme({})).toBeNull()
    expect(extractEntryTheme({ colors: null, newDisplayAsset: null })).toBeNull()
  })
})
