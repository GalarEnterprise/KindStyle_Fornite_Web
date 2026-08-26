import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import bcrypt from 'bcryptjs'
import { generateTokenPair } from '@/lib/services/auth/token-service'
import { createSession, enforceSessionLimit } from '@/lib/services/auth/session-service'
import { setAdminCookies } from '@/lib/auth/cookies'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier, password } = body

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email/usuario y contraseña son requeridos' } },
        { status: 400 }
      )
    }

    const user = await db.user.findFirst({
      where: { OR: [{ email: identifier }, { nickname: identifier }] },
    })

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales incorrectas' } },
        { status: 401 }
      )
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos de administrador' } },
        { status: 403 }
      )
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales incorrectas' } },
        { status: 401 }
      )
    }

    const tokens = await generateTokenPair(user.id, user.role, user.nickname || undefined)
    await enforceSessionLimit(user.id)

    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || undefined
    await createSession(user.id, tokens.accessToken, tokens.refreshToken, userAgent, ipAddress)

    const response = NextResponse.json(
      { success: true, user: { id: user.id, email: user.email, nickname: user.nickname, role: user.role } },
      { status: 200 }
    )
    setAdminCookies(response, tokens)
    return response
  } catch (error) {
    console.error('[API /api/admin/auth/login] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    )
  }
}
