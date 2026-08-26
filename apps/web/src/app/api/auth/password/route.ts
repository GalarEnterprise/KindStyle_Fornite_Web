import { NextRequest, NextResponse } from 'next/server'
import { createPassword, setNickname } from '@/lib/services/auth/auth-service'
import { CreatePasswordSchema, NicknameSchema } from '@/lib/validators/auth'
import { verifyToken } from '@/lib/services/auth/token-service'
import { getAuthCookies } from '@/lib/auth/cookies'

export async function POST(request: NextRequest) {
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

    const body = await request.json()

    if (body.type === 'password') {
      const validated = CreatePasswordSchema.safeParse({
        email: '',
        password: body.password,
        confirmPassword: body.confirmPassword,
      })

      if (!validated.success) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: validated.error.errors.map((e) => e.message).join(', ') },
          },
          { status: 400 }
        )
      }

      await createPassword(payload.userId, body.password)
      return NextResponse.json({ success: true, message: 'Contraseña creada' })
    }

    if (body.type === 'nickname') {
      const validated = NicknameSchema.safeParse({ nickname: body.nickname })

      if (!validated.success) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: validated.error.errors.map((e) => e.message).join(', ') },
          },
          { status: 400 }
        )
      }

      await setNickname(payload.userId, body.nickname)
      return NextResponse.json({ success: true, message: 'Apodo actualizado' })
    }

    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TYPE', message: 'Tipo inválido' } },
      { status: 400 }
    )
  } catch (error) {
    console.error('[API /api/auth/password] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
      },
      { status: 500 }
    )
  }
}
