import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { getAdminPayments } from '@/lib/services/payment/payment-service'
import { z } from 'zod'

const QuerySchema = z.object({
  status: z.enum(['PENDING_RECEIPT', 'VALIDATION_IN_PROGRESS', 'VALIDATED', 'REJECTED']).optional(),
})

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    status: searchParams.get('status') || undefined,
  })

  try {
    const payments = await getAdminPayments(parsed.data?.status)
    return NextResponse.json({ success: true, data: payments })
  } catch (error) {
    console.error('GET /api/admin/payments error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
