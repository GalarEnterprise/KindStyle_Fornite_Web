import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { db } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi(request)
  if ('error' in guard) return guard.error

  if (guard.auth.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Solo Super Admin puede gestionar usuarios' } },
      { status: 403 }
    )
  }

  try {
    const users = await db.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi(request)
  if ('error' in guard) return guard.error

  if (guard.auth.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Solo Super Admin puede crear admins' } },
      { status: 403 }
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

  const { email, password, nickname, role } = body as Record<string, string>
  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email y password requeridos' } },
      { status: 400 }
    )
  }

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Rol inválido' } },
      { status: 400 }
    )
  }

  try {
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        nickname: nickname || null,
        role,
      },
      select: { id: true, email: true, nickname: true, role: true, created_at: true },
    })

    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error) {
    if ((error as Error).name === 'PrismaClientKnownRequestError') {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_EMAIL', message: 'Email ya existe' } },
        { status: 409 }
      )
    }
    console.error('POST /api/admin/users error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
