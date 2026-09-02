import { getLatestSnapshot } from '@/lib/services/catalog/snapshot-service'
import { buildShopDisplayModel } from '@/lib/services/catalog/display-model'
import { getBannerReferences } from '@/lib/services/catalog/banner-reference-service'
import { SectionSidebar } from '@/components/shop/section-sidebar'
import { SectionHeader } from '@/components/shop/section-header'
import { BundleCard } from '@/components/shop/bundle-card'
import { ProductCard } from '@/components/shop/product-card'
import { LastUpdateBadge } from '@/components/shop/last-update-badge'
import { ProductGridSkeleton } from '@/components/shop/product-grid'
import { PostLoginHandler } from '@/components/shop/post-login-handler'

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

  const bannerReferences = await getBannerReferences(activeItems)
  const displaySections = buildShopDisplayModel(activeItems, bannerReferences)

  const sections = displaySections.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    thumbUrl: s.banner?.image ?? null,
  }))

  return (
    <div className="min-h-screen bg-gray-950">
      <PostLoginHandler />
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

        <div className="lg:flex lg:items-start lg:gap-8">
          <SectionSidebar sections={sections} />

          <div className="flex-1 min-w-0">
            {displaySections.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">No hay productos disponibles en la tienda de hoy.</p>
              </div>
            ) : (
              displaySections.map((section, index) => (
                <section
                  key={section.id}
                  id={`section-${section.slug}`}
                  className="mb-8 shop-section"
                >
                  <SectionHeader
                    title={section.title}
                    entryCount={section.entries.length}
                    banner={section.banner}
                    priority={index === 0}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {section.entries.map((entry) => {
                      if (entry.type === 'bundle') {
                        return (
                          <BundleCard
                            key={entry.id}
                            offerId={entry.offerId}
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
    </div>
  )
}
