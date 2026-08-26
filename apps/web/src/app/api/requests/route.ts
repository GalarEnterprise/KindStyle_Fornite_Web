import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/client'
import { CreateRequestSchema } from '@/lib/validators/requests'
import {
  createRequestFromCart,
  getUserRequests,
  buildMessageForRequest,
} from '@/lib/services/requests/request-service'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' } },
        { status: 401 }
      )
    }

    const requests = await getUserRequests(user.userId)
    return NextResponse.json({ success: true, data: requests })
  } catch (error) {
    console.error('[API /api/requests GET] Error:', error)
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

    const body = await request.json().catch(() => ({}))
    const parsed = CreateRequestSchema.safeParse(body)

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

    const result = await createRequestFromCart(user.userId)

    if (!result.success) {
      const status =
        result.error.code === 'CART_EMPTY'
          ? 409
          : result.error.code === 'PRODUCT_UNAVAILABLE' || result.error.code === 'NICKNAME_REQUIRED'
            ? 400
            : 500
      return NextResponse.json(result, { status })
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.userId },
      select: { nickname: true },
    })

    const { message, whatsappUrl } = buildMessageForRequest(result.data, fullUser?.nickname ?? '')

    return NextResponse.json(
      { success: true, data: { ...result.data, message, whatsappUrl } },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API /api/requests POST] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    )
  }
}
