import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { markAsRead } from '@/lib/services/notification/notification-service'
import { db } from '@/lib/db/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser(request)
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
      { status: 401 }
    )
  }

  try {
    const notification = await db.notification.findUnique({ where: { id: params.id } })
    if (!notification || notification.user_id !== auth.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Notificación no encontrada' } },
        { status: 404 }
      )
    }

    await markAsRead(params.id)
    return NextResponse.json({ success: true, data: { read: true } })
  } catch (error) {
    console.error('POST /api/notifications/[id]/read error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
