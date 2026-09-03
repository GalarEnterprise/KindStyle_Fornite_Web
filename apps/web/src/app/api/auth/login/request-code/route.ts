import { NextRequest, NextResponse } from 'next/server'
import { EmailSchema } from '@/lib/validators/auth'
import { requestLoginCode } from '@/lib/services/auth/auth-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = EmailSchema.safeParse(body)

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
    const result = await requestLoginCode(email)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[API /api/auth/login/request-code] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
      },
      { status: 500 }
    )
  }
}
