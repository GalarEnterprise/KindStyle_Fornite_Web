import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { VerifyCodeSchema } from '@/lib/validators/auth'
import { generateResetToken } from '@/lib/services/auth/token-service'

const MAX_ATTEMPTS = 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = VerifyCodeSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: validated.error.errors.map((e) => e.message).join(', ') },
        },
        { status: 400 }
      )
    }

    const { email, code } = validated.data

    // Find the most recent unverified PASSWORD_RESET code
    const verification = await db.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'PASSWORD_RESET',
        verified: false,
      },
      orderBy: { created_at: 'desc' },
    })

    if (!verification) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CODE', message: 'Código inválido' } },
        { status: 400 }
      )
    }

    // Check attempts
    if (verification.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { success: false, error: { code: 'BLOCKED', message: 'Demasiados intentos. Solicita un nuevo código' } },
        { status: 429 }
      )
    }

    // Check expiry
    if (verification.expires_at < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: 'EXPIRED', message: 'El código ha expirado. Solicita uno nuevo' } },
        { status: 400 }
      )
    }

    // Verify code
    if (verification.code !== code) {
      await db.verificationCode.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      })
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CODE', message: 'Código incorrecto' } },
        { status: 400 }
      )
    }

    // Mark code as verified
    await db.verificationCode.update({
      where: { id: verification.id },
      data: { verified: true },
    })

    // Generate a short-lived token for the reset password step
    const token = await generateResetToken(email)

    return NextResponse.json({
      success: true,
      token,
    })
  } catch (error) {
    console.error('[API /api/auth/forgot-password/verify] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
      },
      { status: 500 }
    )
  }
}
