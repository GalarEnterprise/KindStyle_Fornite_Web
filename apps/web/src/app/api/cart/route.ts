import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { AddToCartSchema } from '@/lib/validators/cart'
import { addItem, getCart } from '@/lib/services/cart/cart-service'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' } },
        { status: 401 }
      )
    }

    const items = await getCart(user.userId)
    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('[API /api/cart GET] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = AddToCartSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message ?? 'Datos inválidos',
          },
        },
        { status: 422 }
      )
    }

    const result = await addItem(user.userId, parsed.data)

    if (!result.success) {
      const status =
        result.error.code === 'PRODUCT_NOT_FOUND' || result.error.code === 'BUNDLE_NOT_FOUND'
          ? 404
          : result.error.code === 'ITEM_ALREADY_IN_CART' ||
              result.error.code === 'CART_CONFLICT_RESOLUTION_INVALID'
            ? 409
            : result.error.code === 'CREDENTIALS_REQUIRED' ||
                result.error.code === 'NOT_GIFTABLE' ||
                result.error.code === 'VALIDATION_ERROR'
              ? 422
              : result.error.code === 'CART_OPERATION_FAILED'
                ? 500
                : 400
      return NextResponse.json(result, { status })
    }

    if ('status' in result.data && result.data.status === 'pending_resolution') {
      return NextResponse.json(result, { status: 200 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[API /api/cart POST] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    )
  }
}
