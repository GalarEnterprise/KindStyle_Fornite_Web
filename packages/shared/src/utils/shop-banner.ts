import type {
  ShopEntryTheme,
  ShopThemeSourceEntry,
} from '../types/shop-banner'

const HEX_COLOR_RE = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/
const THEME_KEYS = ['color1', 'color3', 'textBackgroundColor', 'tileImage'] as const

const ALLOWED_IMAGE_HOSTS = ['fortnite-api.com', 'epicgames.com']

export function normalizeHexColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().toLowerCase()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  return HEX_COLOR_RE.test(withHash) ? withHash : undefined
}

export function isAllowedImageHost(value: unknown): value is string {
  if (typeof value !== 'string' || !value.startsWith('https://')) return false
  try {
    const host = new URL(value).hostname
    return ALLOWED_IMAGE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))
  } catch {
    return false
  }
}

export function isShopEntryTheme(value: unknown): value is ShopEntryTheme {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const candidate = value as Record<string, unknown>
  return THEME_KEYS.every(
    (key) => candidate[key] === undefined || candidate[key] === null || typeof candidate[key] === 'string'
  )
}

export function parseShopEntryTheme(value: unknown): ShopEntryTheme | null {
  return isShopEntryTheme(value) ? value : null
}

function pickTileImage(entry: ShopThemeSourceEntry): string | undefined {
  const asset = entry.newDisplayAsset
  const instances = asset?.materialInstances
  if (Array.isArray(instances)) {
    const primary = instances[0]?.images?.['OfferImage']
    if (isAllowedImageHost(primary)) return primary

    for (const instance of instances) {
      for (const url of Object.values(instance?.images ?? {})) {
        if (isAllowedImageHost(url)) return url
      }
    }
  }

  const renderImages = asset?.renderImages
  if (Array.isArray(renderImages)) {
    for (const renderImage of renderImages) {
      const url = renderImage?.image
      if (isAllowedImageHost(url)) return url
    }
  }
  return undefined
}

export function extractEntryTheme(entry: ShopThemeSourceEntry | null | undefined): ShopEntryTheme | null {
  if (!entry) return null

  const theme: ShopEntryTheme = {}

  const color1 = normalizeHexColor(entry.colors?.color1)
  if (color1) theme.color1 = color1

  const color3 = normalizeHexColor(entry.colors?.color3)
  if (color3) theme.color3 = color3

  const textBg = normalizeHexColor(entry.colors?.textBackgroundColor)
  if (textBg) theme.textBackgroundColor = textBg

  const tileImage = pickTileImage(entry)
  if (tileImage) theme.tileImage = tileImage

  return Object.keys(theme).length > 0 ? theme : null
}
