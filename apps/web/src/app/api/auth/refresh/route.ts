import { NextRequest, NextResponse } from 'next/server'
import { refreshSession } from '@/lib/services/auth/auth-service'
import { getAuthCookies, setAuthCookies } from '@/lib/auth/cookies'

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = getAuthCookies(request)

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
        { status: 401 }
      )
    }

    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined

    const result = await refreshSession(refreshToken, userAgent, ipAddress)

    if (!result.success) {
      return NextResponse.json(result, { status: 401 })
    }

    const response = NextResponse.json(result, { status: 200 })
    setAuthCookies(response, result.tokens)

    return response
  } catch (error) {
    console.error('[API /api/auth/refresh] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
      },
      { status: 500 }
    )
  }
}
