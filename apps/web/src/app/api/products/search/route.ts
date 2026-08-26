import { NextRequest, NextResponse } from 'next/server'
import { searchProducts } from '@/lib/services/catalog/product-service'
import { SearchQuerySchema } from '@/lib/validators/catalog'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = {
      q: searchParams.get('q') || '',
      page: searchParams.get('page') || '1',
      perPage: searchParams.get('perPage') || '20',
    }

    const validated = SearchQuerySchema.safeParse(params)

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

    const result = await searchProducts(
      validated.data.q,
      validated.data.page,
      validated.data.perPage
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[API /api/products/search] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search products',
        },
      },
      { status: 500 }
    )
  }
}
