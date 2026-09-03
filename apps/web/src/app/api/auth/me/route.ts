import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/services/auth/token-service'
import { getAuthCookies } from '@/lib/auth/cookies'
import { db } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const { accessToken } = getAuthCookies(request)

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
        { status: 401 }
      )
    }

    const payload = await verifyToken(accessToken)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Token inválido' } },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        verification_status: true,
        created_at: true,
        password_hash: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' } },
        { status: 404 }
      )
    }

    const { password_hash, ...userData } = user
    return NextResponse.json({ success: true, data: { ...userData, hasPassword: !!password_hash } })
  } catch (error) {
    console.error('[API /api/auth/me] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
      },
      { status: 500 }
    )
  }
}
