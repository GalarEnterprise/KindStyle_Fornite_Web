import type { ProductType, GiftabilityStatus } from '@kindstyle/database'

const NOT_GIFTABLE_TYPES: ProductType[] = ['VBucks', 'BATTLE_PASS', 'CREW']

export function resolveGiftability(type: ProductType): GiftabilityStatus {
  if (NOT_GIFTABLE_TYPES.includes(type)) {
    return 'NOT_GIFTABLE'
  }

  if (type === 'BUNDLE') {
    return 'UNKNOWN'
  }

  return 'GIFTABLE'
}
