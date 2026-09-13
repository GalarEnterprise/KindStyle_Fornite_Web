import { ProductCard, ProductCardSkeleton } from './product-card'

interface ProductData {
  id: string
  name: string
  priceVbucks: number
  priceMxn: number
  imageUrl: string | null
  iconUrl: string | null
  rarity: string | null
  type: string
  giftable: string
  visible: boolean
}

interface ProductGridProps {
  products: ProductData[]
  cardColor?: string
  onAddToCart?: (productId: string) => void
}

export function ProductGrid({ products, cardColor, onAddToCart }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          productId={product.id}
          name={product.name}
          priceVbucks={product.priceVbucks}
          priceMxn={product.priceMxn}
          imageUrl={product.imageUrl}
          iconUrl={product.iconUrl}
          rarity={product.rarity}
          type={product.type}
          giftable={product.giftable}
          visible={product.visible}
          cardColor={cardColor}
          onAddToCart={() => onAddToCart?.(product.id)}
        />
      ))}
    </div>
  )
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
