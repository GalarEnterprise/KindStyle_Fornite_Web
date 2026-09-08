import type { ProductType, GiftabilityStatus } from '@kindstyle/database'

const NOT_GIFTABLE_TYPES: ProductType[] = ['VBucks', 'BATTLE_PASS', 'CREW']

export function resolveGiftability(type: ProductType, adminOverride?: GiftabilityStatus): GiftabilityStatus {
  if (adminOverride) {
    return adminOverride
  }

  if (NOT_GIFTABLE_TYPES.includes(type)) {
    return 'NOT_GIFTABLE'
  }

  if (type === 'BUNDLE') {
    return 'UNKNOWN'
  }

  return 'GIFTABLE'
}

export function isVisibleInCatalog(giftable: GiftabilityStatus): boolean {
  return giftable !== 'UNKNOWN'
}

export function shouldShowInShop(type: ProductType, giftable: GiftabilityStatus): boolean {
  if (NOT_GIFTABLE_TYPES.includes(type)) {
    return true
  }
  return isVisibleInCatalog(giftable)
}
