import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/client'

const BodySchema = z.object({
  phone: z.string().min(1, 'El número es obligatorio'),
})

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
      { status: 401 }
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

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    )
  }

  try {
    await db.user.update({
      where: { id: auth.userId },
      data: { phone: parsed.data.phone },
    })

    return NextResponse.json({ success: true, data: { saved: true } })
  } catch (error) {
    console.error('POST /api/user/phone error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
