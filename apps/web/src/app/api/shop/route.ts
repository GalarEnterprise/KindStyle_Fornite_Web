import { NextResponse } from 'next/server'
import { getLatestSnapshot } from '@/lib/services/catalog/snapshot-service'
import { getCollections } from '@/lib/services/catalog/collection-service'

export async function GET() {
  try {
    const snapshot = await getLatestSnapshot()

    if (!snapshot) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SHOP',
            message: 'No shop data available yet',
          },
        },
        { status: 404 }
      )
    }

    const collections = await getCollections()

    const collectionsWithProducts = await Promise.all(
      collections.map(async (collection) => {
        const items = snapshot.shop_items
          .filter((item) => {
            if (!item.product.active || !item.product.visible) return false

            if (collection.type === 'section') {
              return item.section === collection.name
            } else {
              return !item.section && item.product.type === collection.name
            }
          })
          .slice(0, 20)
          .map((item) => ({
            id: item.product.id,
            internalSku: item.product.internal_sku,
            name: item.product.name,
            priceVbucks: item.product.price_vbucks,
            imageUrl: item.product.image_url,
            iconUrl: item.product.icon_url,
            type: item.product.type,
            rarity: item.product.rarity,
            giftable: item.product.giftable,
          }))

        return {
          name: collection.name,
          slug: collection.slug,
          items,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        shopDate: snapshot.shop_date.toISOString().split('T')[0],
        lastUpdated: snapshot.fetched_at.toISOString(),
        collections: collectionsWithProducts,
      },
    })
  } catch (error) {
    console.error('[API /api/shop] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch shop data',
        },
      },
      { status: 500 }
    )
  }
}
