import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { setNickname } from '@/lib/services/auth/auth-service'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nickname } = body

    if (!nickname || nickname.length < 3 || nickname.length > 20) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nickname debe tener 3-20 caracteres' } },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nickname solo puede contener letras, números y guiones bajos' } },
        { status: 400 }
      )
    }

    const updatedUser = await setNickname(user.userId, nickname)

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        nickname: updatedUser.nickname,
        role: updatedUser.role,
      },
    })
  } catch (error) {
    console.error('[API /api/user/nickname] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    )
  }
}
