export interface ShopEntryTheme {
  color1?: string
  color3?: string
  textBackgroundColor?: string
  tileImage?: string
}

export interface ShopThemeSourceColors {
  color1?: string
  color3?: string
  textBackgroundColor?: string
  [key: string]: string | undefined
}

export interface ShopThemeSourceEntry {
  colors?: ShopThemeSourceColors | null
  newDisplayAsset?: {
    id?: string
    materialInstances?: Array<{ images: Record<string, string> }> | null
    renderImages?: Array<{ image?: string } | null> | null
  } | null
}

export interface BannerReference {
  id: string
  iconUrl: string | null
}
