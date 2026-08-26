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
        result.error.code === 'PRODUCT_NOT_FOUND'
          ? 404
          : result.error.code === 'CREDENTIALS_REQUIRED'
            ? 422
            : 400
      return NextResponse.json(result, { status })
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
