import { getLatestSnapshot } from '@/lib/services/catalog/snapshot-service'
import { getCollections } from '@/lib/services/catalog/collection-service'
import { CollectionSection } from '@/components/shop/collection-section'
import { LastUpdateBadge } from '@/components/shop/last-update-badge'
import { ProductGridSkeleton } from '@/components/shop/product-grid'

export default async function ShopPage() {
  const snapshot = await getLatestSnapshot()
  const collections = await getCollections()

  const vbucksRate = 7.5

  const collectionData = collections.map((collection) => {
    const items = snapshot?.shop_items
      .filter((item) => {
        if (!item.product.active || !item.product.visible) return false
        if (collection.type === 'section') {
          return item.section === collection.name
        }
        return !item.section && item.product.type === collection.name
      })
      .map((item) => ({
        id: item.product.id,
        name: item.product.name,
        priceVbucks: item.product.price_vbucks,
        priceMxn: Number(item.product.price_vbucks) * (vbucksRate / 100),
        imageUrl: item.product.image_url,
        iconUrl: item.product.icon_url,
        rarity: item.product.rarity,
        type: item.product.type,
        visible: item.product.visible,
      })) || []

    return {
      ...collection,
      items,
    }
  })

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Tienda de Fortnite</h1>
            <p className="text-gray-400">
              La tienda aún no ha sido sincronizada. Espera unos minutos para que los productos aparezcan.
            </p>
            <ProductGridSkeleton count={10} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Tienda de Fortnite</h1>
            <p className="mt-1 text-sm text-gray-400">
              {snapshot.shop_date.toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <LastUpdateBadge lastUpdated={snapshot.fetched_at.toISOString()} />
        </div>

        {collectionData.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No hay productos disponibles en la tienda de hoy.</p>
          </div>
        ) : (
          collectionData.map((collection) => (
            <CollectionSection
              key={collection.slug}
              title={collection.name}
              products={collection.items}
            />
          ))
        )}
      </div>
    </div>
  )
}
