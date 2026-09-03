import { NextRequest, NextResponse } from 'next/server'
import { ChangePasswordSchema } from '@/lib/validators/auth'
import { verifyToken } from '@/lib/services/auth/token-service'
import { getAuthCookies } from '@/lib/auth/cookies'
import { db } from '@/lib/db/client'
import bcrypt from 'bcryptjs'

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
    const validated = ChangePasswordSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: validated.error.errors.map((e) => e.message).join(', ') },
        },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validated.data

    // Get user
    const user = await db.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' } },
        { status: 404 }
      )
    }

    // Verify current password
    if (!user.password_hash) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_PASSWORD', message: 'No tienes contraseña configurada. Usa crear contraseña' } },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'La contraseña actual es incorrecta' } },
        { status: 400 }
      )
    }

    // Update password
    const hash = await bcrypt.hash(newPassword, 12)
    await db.user.update({
      where: { id: user.id },
      data: { password_hash: hash },
    })

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    })
  } catch (error) {
    console.error('[API /api/auth/change-password] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
      },
      { status: 500 }
    )
  }
}
