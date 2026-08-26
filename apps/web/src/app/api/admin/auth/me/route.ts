import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyToken } from '@/lib/services/auth/token-service'
import { getAdminCookies } from '@/lib/auth/cookies'

export async function GET(request: NextRequest) {
  try {
    const { accessToken } = getAdminCookies(request)
    if (!accessToken) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } }, { status: 401 })
    }

    const payload = await verifyToken(accessToken)
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true, nickname: true, role: true } })
    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('[API /api/admin/auth/me] Error:', error)
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 })
  }
}
