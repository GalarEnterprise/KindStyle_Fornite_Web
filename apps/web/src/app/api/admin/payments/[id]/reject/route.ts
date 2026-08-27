import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth/middleware'
import { rejectPayment } from '@/lib/services/payment/payment-service'

const ParamsSchema = z.object({
  id: z.string().uuid('Invalid payment ID'),
})

const BodySchema = z.object({
  reason: z.string().min(1, 'El motivo es obligatorio'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
      { status: 401 }
    )
  }

  const parsedParams = ParamsSchema.safeParse(params)
  if (!parsedParams.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsedParams.error.issues[0].message } },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'JSON inválido' } },
      { status: 400 }
    )
  }

  const parsedBody = BodySchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsedBody.error.issues[0].message } },
      { status: 400 }
    )
  }

  try {
    const result = await rejectPayment(parsedParams.data.id, auth.userId, parsedBody.data.reason)

    if (!result.success) {
      const status = result.error.code === 'NOT_FOUND' ? 404 : 400
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('POST /api/admin/payments/[id]/reject error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
