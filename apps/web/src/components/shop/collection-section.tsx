import { ProductGrid } from './product-grid'

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
  onAddToCart?: (productId: string) => void
}

export function CollectionSection({ title, products, onAddToCart }: CollectionSectionProps) {
  if (products.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-purple-500" />
        {title}
        <span className="text-sm font-normal text-gray-400">({products.length})</span>
      </h2>
      <ProductGrid products={products} onAddToCart={onAddToCart} />
    </section>
  )
}
