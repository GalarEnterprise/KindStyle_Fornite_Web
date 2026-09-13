import { AddToCartButton } from '@/components/cart/add-to-cart-button'
import { ProductPlaceholder } from '@/components/shop/product-placeholder'
import { isValidImageUrl } from '@/lib/utils/url'

interface ProductCardProps {
  productId?: string
  name: string
  priceVbucks: number
  priceMxn: number
  imageUrl: string | null
  iconUrl: string | null
  rarity: string | null
  type: string
  giftable: string
  visible: boolean
  cardColor?: string
  cardGradient?: string
  onAddToCart?: () => void
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: 'bg-gray-500',
  UNCOMMON: 'bg-green-600',
  RARE: 'bg-blue-600',
  EPIC: 'bg-purple-600',
  LEGENDARY: 'bg-orange-500',
  MYTHIC: 'bg-yellow-500',
  EXOTIC: 'bg-cyan-500',
  ICON_SERIES: 'bg-indigo-700',
  STAR_WARS: 'bg-yellow-700',
  DC: 'bg-blue-900',
  MARVEL: 'bg-red-700',
  GAMING_LEGENDS: 'bg-purple-900',
  LAVA: 'bg-red-600',
  FROZEN: 'bg-blue-400',
  SHADOW: 'bg-gray-900',
  SLURP: 'bg-cyan-400',
  DARK: 'bg-gray-800',
}

export function ProductCard({
  productId,
  name,
  priceVbucks,
  priceMxn,
  imageUrl,
  iconUrl,
  rarity,
  type,
  giftable,
  visible,
  cardColor,
  cardGradient,
  onAddToCart,
}: ProductCardProps) {
  const displayImage = isValidImageUrl(imageUrl)
    ? imageUrl
    : isValidImageUrl(iconUrl)
      ? iconUrl
      : null
  const rarityColor = rarity ? RARITY_COLORS[rarity] || 'bg-gray-500' : 'bg-gray-500'

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-lg bg-gray-900 border border-gray-700 transition-all hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20"
      style={cardColor ? { borderColor: cardColor } : undefined}
    >
      {rarity && (
        <div className={`absolute top-0 left-0 right-0 h-1 ${rarityColor}`} />
      )}

      <div
        className="aspect-square overflow-hidden bg-gray-800"
        style={cardGradient ? { background: cardGradient } : undefined}
      >
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
          Agregar
        </button>
      )}
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-gray-900 border border-gray-700 animate-pulse">
      <div className="aspect-square bg-gray-800" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-700 rounded w-1/3" />
      </div>
      <div className="mx-3 mb-3 h-9 bg-gray-700 rounded-md" />
    </div>
  )
}
