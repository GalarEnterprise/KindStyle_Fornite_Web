import { ProductGrid } from './product-grid'
import { withAlpha } from '@/lib/utils/color'

interface CollectionProduct {
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

interface CollectionSectionProps {
  title: string
  products: CollectionProduct[]
  cardColor?: string
  sectionBgColor?: string
  onAddToCart?: (productId: string) => void
}

export function CollectionSection({ title, products, cardColor, sectionBgColor, onAddToCart }: CollectionSectionProps) {
  if (products.length === 0) return null

  return (
    <section
      className="mb-8 rounded-xl p-4"
      style={sectionBgColor ? { backgroundColor: withAlpha(sectionBgColor, 0.2) } : undefined}
    >
      <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-purple-500" />
        {title}
        <span className="text-sm font-normal text-gray-300">({products.length})</span>
      </h2>
      <ProductGrid products={products} cardColor={cardColor} onAddToCart={onAddToCart} />
    </section>
  )
}
