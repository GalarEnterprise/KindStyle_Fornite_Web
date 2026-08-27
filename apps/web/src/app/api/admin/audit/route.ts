import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { db } from '@/lib/db/client'
import { z } from 'zod'

const QuerySchema = z.object({
  entity: z.string().optional(),
  action: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi(request)
  if ('error' in guard) return guard.error

  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    entity: searchParams.get('entity'),
    action: searchParams.get('action'),
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    )
  }

  const { entity, action, from, to, page, limit } = parsed.data
  const skip = (page - 1) * limit

  try {
    const where: Record<string, unknown> = {}
    if (entity) where.entity = entity
    if (action) where.action = action
    if (from || to) {
      where.created_at = {}
      if (from) (where.created_at as Record<string, Date>).gte = new Date(from)
      if (to) (where.created_at as Record<string, Date>).lte = new Date(to)
    }

    const [events, total] = await Promise.all([
      db.eventLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      db.eventLog.count({ where }),
    ])

    return NextResponse.json({ success: true, data: { events, total, page, limit } })
  } catch (error) {
    console.error('GET /api/admin/audit error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
