import { NextRequest, NextResponse } from 'next/server'
import { revokeSession } from '@/lib/services/auth/session-service'
import { getAuthCookies, clearAuthCookies } from '@/lib/auth/cookies'

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = getAuthCookies(request)

    if (accessToken) {
      await revokeSession(accessToken)
    }

    const response = NextResponse.json(
      { success: true, message: 'Sesión cerrada correctamente' },
      { status: 200 }
    )

    clearAuthCookies(response)
    return response
  } catch (error) {
    console.error('[API /api/auth/logout] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
      },
      { status: 500 }
    )
  }
}
