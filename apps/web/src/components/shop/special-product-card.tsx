import { AddToCartButton } from '@/components/cart/add-to-cart-button'
import { ProductPlaceholder } from '@/components/shop/product-placeholder'
import type { SpecialProductType } from '@/lib/services/catalog/display-model'
import { isValidImageUrl } from '@/lib/utils/url'

interface SpecialProductCardProps {
  productId?: string
  name: string
  priceVbucks: number
  priceMxn: number
  imageUrl: string | null
  iconUrl: string | null
  type: string
  giftable: string
  visible: boolean
  specialType: SpecialProductType
  onAddToCart?: () => void
}

const SPECIAL_BADGES: Record<SpecialProductType, { label: string; color: string }> = {
  VBucks: { label: 'V-Bucks', color: 'bg-yellow-500 text-black' },
  BATTLE_PASS: { label: 'Pase', color: 'bg-blue-600 text-white' },
  CREW: { label: 'Crew', color: 'bg-purple-600 text-white' },
  DLC: { label: 'DLC', color: 'bg-emerald-600 text-white' },
  JAM_TRACK: { label: 'Pista', color: 'bg-pink-600 text-white' },
}

const SPECIAL_TOP_COLORS: Record<SpecialProductType, string> = {
  VBucks: 'bg-yellow-500',
  BATTLE_PASS: 'bg-blue-600',
  CREW: 'bg-purple-600',
  DLC: 'bg-emerald-600',
  JAM_TRACK: 'bg-pink-600',
}

export function SpecialProductCard({
  productId,
  name,
  priceVbucks,
  priceMxn,
  imageUrl,
  iconUrl,
  type,
  giftable,
  visible,
  specialType,
  onAddToCart,
}: SpecialProductCardProps) {
  const displayImage = isValidImageUrl(imageUrl)
    ? imageUrl
    : isValidImageUrl(iconUrl)
      ? iconUrl
      : null
  const badge = SPECIAL_BADGES[specialType]
  const topColor = SPECIAL_TOP_COLORS[specialType]

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg bg-gray-900 border border-gray-700 transition-all hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20">
      <div className={`absolute top-0 left-0 right-0 h-1 ${topColor}`} />

      <div className="absolute top-2 right-2 z-10">
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      <div className="aspect-square overflow-hidden bg-gray-800">
        {displayImage ? (
          <img
            src={displayImage}
            alt={name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <ProductPlaceholder />
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-sm font-semibold text-white truncate" title={name}>
          {name}
        </h3>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold text-yellow-400">
            {priceVbucks.toLocaleString('es-MX')} V
          </span>
        </div>

        <span className="mt-0.5 text-xs text-gray-400">
          ${priceMxn.toFixed(2)} MXN
        </span>

        <p className="mt-1 text-[10px] text-gray-500 leading-tight">
          Requiere credenciales de Epic Games
        </p>
      </div>

      {productId ? (
        <AddToCartButton productId={productId} productName={name} productType={type} giftable={giftable} />
      ) : (
        <button
          onClick={onAddToCart}
          disabled={!visible}
          className="mx-3 mb-3 rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Comprar
        </button>
      )}
    </div>
  )
}

export function SpecialProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-gray-900 border border-gray-700 animate-pulse">
      <div className="aspect-square bg-gray-800" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-700 rounded w-1/3" />
        <div className="h-3 bg-gray-700 rounded w-2/3" />
      </div>
      <div className="mx-3 mb-3 h-9 bg-gray-700 rounded-md" />
    </div>
  )
}
