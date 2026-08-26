import { NextRequest, NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/services/catalog/product-service'
import { ProductsQuerySchema } from '@/lib/validators/catalog'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = {
      page: searchParams.get('page') || '1',
      perPage: searchParams.get('perPage') || '20',
      type: searchParams.get('type') || undefined,
      rarity: searchParams.get('rarity') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
    }

    const validated = ProductsQuerySchema.safeParse(params)

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validated.error.errors.map((e) => e.message).join(', '),
          },
        },
        { status: 400 }
      )
    }

    const result = await getAllProducts(validated.data)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[API /api/products] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch products',
        },
      },
      { status: 500 }
    )
  }
}
