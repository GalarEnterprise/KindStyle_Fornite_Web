import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth/middleware'
import { uploadReceipt } from '@/lib/services/payment/payment-service'

const ParamsSchema = z.object({
  id: z.string().uuid('Invalid payment ID'),
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

  const parsed = ParamsSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('receipt') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FILE', message: 'Comprobante no proporcionado' } },
        { status: 400 }
      )
    }

    const result = await uploadReceipt(parsed.data.id, auth.userId, file)

    if (!result.success) {
      const status = result.error.code === 'NOT_FOUND' ? 404 : 400
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('POST /api/payment/[id]/receipt error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
