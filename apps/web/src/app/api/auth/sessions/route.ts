import { NextRequest, NextResponse } from 'next/server'
import { getUserSessions } from '@/lib/services/auth/session-service'
import { verifyToken } from '@/lib/services/auth/token-service'
import { getAuthCookies } from '@/lib/auth/cookies'

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

    const sessions = await getUserSessions(payload.userId)

    return NextResponse.json({ success: true, data: sessions })
  } catch (error) {
    console.error('[API /api/auth/sessions] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
      },
      { status: 500 }
    )
  }
}
