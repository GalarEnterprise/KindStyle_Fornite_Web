import { getLatestSnapshot } from '@/lib/services/catalog/snapshot-service'
import { buildShopDisplayModel } from '@/lib/services/catalog/display-model'
import { SectionSidebar } from '@/components/shop/section-sidebar'
import { BundleCard } from '@/components/shop/bundle-card'
import { ProductCard } from '@/components/shop/product-card'
import { LastUpdateBadge } from '@/components/shop/last-update-badge'
import { ProductGridSkeleton } from '@/components/shop/product-grid'

export const dynamic = 'force-dynamic'

export default async function ShopPage() {
  const snapshot = await getLatestSnapshot()
  const vbucksRate = 7.5

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

  const activeItems = snapshot.shop_items.filter(
    (item) => item.product.active && item.product.visible
  )

  const displaySections = buildShopDisplayModel(activeItems)

  const sections = displaySections.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
  }))

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

        <SectionSidebar sections={sections} />

        <div className="lg:ml-56">
          {displaySections.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No hay productos disponibles en la tienda de hoy.</p>
            </div>
          ) : (
            displaySections.map((section) => (
              <section
                key={section.id}
                id={`section-${section.slug}`}
                className="mb-8 shop-section"
              >
                <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-1 rounded-full bg-purple-500" />
                  {section.title}
                  <span className="text-sm font-normal text-gray-400">
                    ({section.entries.length})
                  </span>
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {section.entries.map((entry) => {
                    if (entry.type === 'bundle') {
                      return (
                        <BundleCard
                          key={entry.id}
                          name={entry.name}
                          imageUrl={entry.imageUrl}
                          priceVbucks={entry.priceVbucks}
                          components={entry.components}
                        />
                      )
                    }

                    return (
                      <ProductCard
                        key={entry.id}
                        productId={entry.product.id}
                        name={entry.product.name}
                        priceVbucks={entry.product.price_vbucks}
                        priceMxn={Number(entry.product.price_vbucks) * (vbucksRate / 100)}
                        imageUrl={entry.product.image_url}
                        iconUrl={entry.product.icon_url}
                        rarity={entry.product.rarity}
                        type={entry.product.type}
                        visible={entry.product.visible}
                      />
                    )
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
