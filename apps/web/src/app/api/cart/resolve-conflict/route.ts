import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { ResolveCartConflictSchema } from '@/lib/validators/cart'
import { resolveCartConflict } from '@/lib/services/cart/cart-service'

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
    const parsed = ResolveCartConflictSchema.safeParse(body)

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

    const result = await resolveCartConflict(user.userId, parsed.data)

    if (!result.success) {
      const status =
        result.error.code === 'CART_CONFLICT_RESOLUTION_INVALID' ||
        result.error.code === 'ITEM_ALREADY_IN_CART'
          ? 409
          : result.error.code === 'CART_OPERATION_FAILED'
            ? 500
            : 400
      return NextResponse.json(result, { status })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[API /api/cart/resolve-conflict POST] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    )
  }
}
