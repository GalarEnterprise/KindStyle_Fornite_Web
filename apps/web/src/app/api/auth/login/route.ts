import { NextRequest, NextResponse } from 'next/server'
import { loginWithCode, loginWithPassword } from '@/lib/services/auth/auth-service'
import { setAuthCookies } from '@/lib/auth/cookies'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, method, code, password } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email es requerido' } },
        { status: 400 }
      )
    }

    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined

    let result
    if (method === 'code') {
      if (!code) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Código es requerido' } },
          { status: 400 }
        )
      }
      result = await loginWithCode(email, code, userAgent, ipAddress)
    } else if (method === 'password') {
      if (!password) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Contraseña es requerida' } },
          { status: 400 }
        )
      }
      result = await loginWithPassword(email, password, userAgent, ipAddress)
    } else {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Método inválido' } },
        { status: 400 }
      )
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    const response = NextResponse.json(result, { status: 200 })
    setAuthCookies(response, result.tokens)

    return response
  } catch (error) {
    console.error('[API /api/auth/login] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
      },
      { status: 500 }
    )
  }
}
