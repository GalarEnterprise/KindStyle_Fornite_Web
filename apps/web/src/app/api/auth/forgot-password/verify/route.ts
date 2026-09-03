import { NextRequest, NextResponse } from 'next/server'
import { VerifyCodeSchema } from '@/lib/validators/auth'
import { generateResetToken } from '@/lib/services/auth/token-service'
import { verifyCode } from '@/lib/services/auth/verification-code-service'

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

    const result = await verifyCode(email, code, 'PASSWORD_RESET')

    if (!result.success) {
      const status = result.error?.code === 'BLOCKED' ? 429 : 400
      return NextResponse.json(result, { status })
    }

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
