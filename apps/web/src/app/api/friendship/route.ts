import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { registerPlatform, getFriendshipPanel } from '@/lib/services/friendship/friendship-service'

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
      { status: 401 }
    )
  }

  const panel = await getFriendshipPanel(auth.userId)
  return NextResponse.json({ success: true, data: panel })
}

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

  try {
    const result = await registerPlatform(auth.userId, body)
    if (!result.success) {
      const status = result.error.code === 'VALIDATION_ERROR' ? 400 : 409
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      )
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/friendship error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
