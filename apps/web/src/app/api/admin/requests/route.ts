import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { db } from '@/lib/db/client'
import { z } from 'zod'
import { RequestStatus } from '@prisma/client'

const QuerySchema = z.object({
  status: z.nativeEnum(RequestStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi(request)
  if ('error' in guard) return guard.error

  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    status: searchParams.get('status'),
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    )
  }

  const { status, page, limit } = parsed.data
  const skip = (page - 1) * limit

  try {
    const where = status ? { status } : {}

    const [requests, total] = await Promise.all([
      db.request.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, nickname: true } },
          items: { select: { id: true, product_name_snapshot: true, price_vbucks_snapshot: true, quantity: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      db.request.count({ where }),
    ])

    return NextResponse.json({ success: true, data: { requests, total, page, limit } })
  } catch (error) {
    console.error('GET /api/admin/requests error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
