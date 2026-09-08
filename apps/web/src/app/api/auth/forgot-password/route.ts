import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { sendVerificationCode } from '@/lib/services/auth/email-service'
import { createVerificationCode, checkCooldown } from '@/lib/services/auth/verification-code-service'
import { ForgotPasswordSchema } from '@/lib/validators/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = ForgotPasswordSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: validated.error.errors.map((e) => e.message).join(', ') },
        },
        { status: 400 }
      )
    }

    const { email } = validated.data

    // Find user by email
    const user = await db.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Si el email está registrado, recibirás un código de verificación',
      })
    }

    // Check cooldown
    const cooldown = await checkCooldown(email, 'PASSWORD_RESET')
    if (!cooldown.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'COOLDOWN',
            message: `Debes esperar ${cooldown.cooldownRemaining} segundos antes de solicitar otro código`,
            cooldownRemaining: cooldown.cooldownRemaining,
          },
        },
        { status: 429 }
      )
    }

    // Create new code
    const { code } = await createVerificationCode(email, 'PASSWORD_RESET', user.id)

    await sendVerificationCode({ email, code, context: 'PASSWORD_RESET' })

    return NextResponse.json({
      success: true,
      message: 'Si el email está registrado, recibirás un código de verificación',
    })
  } catch (error) {
    console.error('[API /api/auth/forgot-password] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
      },
      { status: 500 }
    )
  }
}
