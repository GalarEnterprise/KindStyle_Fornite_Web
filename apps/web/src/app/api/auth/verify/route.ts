import { NextRequest, NextResponse } from 'next/server'
import { VerifyCodeSchema } from '@/lib/validators/auth'
import { verifyCode } from '@/lib/services/auth/auth-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = VerifyCodeSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validated.error.errors.map((e) => e.message).join(', '),
          },
        },
        { status: 400 }
      )
    }

    const result = await verifyCode(validated.data.email, validated.data.code)

    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    console.error('[API /api/auth/verify] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
      },
      { status: 500 }
    )
  }
}
