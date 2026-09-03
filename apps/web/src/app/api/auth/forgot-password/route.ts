import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { sendVerificationCode } from '@/lib/services/auth/email-service'
import { ForgotPasswordSchema } from '@/lib/validators/auth'

const CODE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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

    // Invalidate any existing PASSWORD_RESET codes for this email
    await db.verificationCode.updateMany({
      where: {
        email,
        type: 'PASSWORD_RESET',
        verified: false,
      },
      data: { verified: true },
    })

    // Generate new code
    const code = generateCode()

    await db.verificationCode.create({
      data: {
        user_id: user.id,
        email,
        code,
        type: 'PASSWORD_RESET',
        expires_at: new Date(Date.now() + CODE_EXPIRY_MS),
        attempts: 0,
      },
    })

    await sendVerificationCode(email, code)

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
