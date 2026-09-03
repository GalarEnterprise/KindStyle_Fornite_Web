import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { ResetPasswordSchema } from '@/lib/validators/auth'
import { revokeAllUserSessions } from '@/lib/services/auth/session-service'
import { verifyResetToken } from '@/lib/services/auth/token-service'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = ResetPasswordSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: validated.error.errors.map((e) => e.message).join(', ') },
        },
        { status: 400 }
      )
    }

    const { email, code, password } = validated.data

    // Verify the reset token from query param or body
    const token = body.token
    if (token) {
      const tokenPayload = await verifyResetToken(token)
      if (!tokenPayload || tokenPayload.email !== email) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_TOKEN', message: 'Token inválido' } },
          { status: 400 }
        )
      }
    }

    // Find the most recent verified PASSWORD_RESET code
    const verification = await db.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'PASSWORD_RESET',
        verified: true,
      },
      orderBy: { created_at: 'desc' },
    })

    if (!verification) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CODE', message: 'Código inválido' } },
        { status: 400 }
      )
    }

    // Find user and update password
    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' } },
        { status: 404 }
      )
    }

    const hash = await bcrypt.hash(password, 12)
    await db.user.update({
      where: { id: user.id },
      data: { password_hash: hash },
    })

    // Invalidate all user sessions
    await revokeAllUserSessions(user.id)

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña',
    })
  } catch (error) {
    console.error('[API /api/auth/reset-password] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
      },
      { status: 500 }
    )
  }
}
