import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { markRequestSent, confirmFriendship } from '@/lib/services/friendship/friendship-service'

const ActionSchema = z.object({
  action: z.enum(['mark-request-sent', 'confirm-friendship']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; botId: string }> }
) {
  const guard = await requireAdminApi(request)
  if ('error' in guard) return guard.error

  const { botId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'JSON inválido' } },
      { status: 400 }
    )
  }

  const parsed = ActionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Acción inválida' } },
      { status: 400 }
    )
  }

  try {
    const result =
      parsed.data.action === 'mark-request-sent'
        ? await markRequestSent(guard.auth.userId, botId)
        : await confirmFriendship(guard.auth.userId, botId)

    if (!result.success) {
      const status = result.error.code === 'NOT_FOUND' ? 404 : result.error.code === 'REQUEST_NOT_SENT' ? 409 : 400
      return NextResponse.json({ success: false, error: result.error }, { status })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('PATCH /api/admin/friendships/[id]/bots/[botId] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 }
    )
  }
}
